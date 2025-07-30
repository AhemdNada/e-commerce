const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/receipts');
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Create order
router.post('/', authMiddleware, upload.single('receipt'), async (req, res) => {
    // Log incoming request for debugging
    console.log('Order creation request:', {
        user: req.user,
        body: req.body,
        file: req.file
    });
    const { payment_method, address, phone, items } = req.body;
    if (!payment_method || !address || !phone || !items) {
        return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    let uploaded_file = null;
    if (req.file) {
        uploaded_file = 'receipts/' + req.file.filename;
    }
    let itemsArr;
    try {
        itemsArr = JSON.parse(items);
        if (!Array.isArray(itemsArr) || itemsArr.length === 0) {
            return res.status(400).json({ success: false, message: 'Items array is empty or invalid.' });
        }
    } catch (parseErr) {
        console.error('Failed to parse items:', items, parseErr);
        return res.status(400).json({ success: false, message: 'Invalid items format.' });
    }
    // Log parsed items
    console.log('Parsed items:', itemsArr);
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Invalid user token.' });
        }
        // Fetch current shipping value from settings
        let shipping_fee = 0.00;
        try {
            const [rows] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['shipping']);
            if (rows.length > 0) {
                shipping_fee = parseFloat(rows[0].value) || 0.00;
            }
        } catch (err) {
            console.error('Failed to fetch shipping value, defaulting to 0.00:', err);
        }
        // Calculate order total (sum of item subtotals + shipping_fee)
        let subtotal = 0.00;
        for (const item of itemsArr) {
            subtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
        }
        const order_total = subtotal + shipping_fee;
        const [orderResult] = await db.query(
            'INSERT INTO orders (user_id, payment_method, address, phone, uploaded_file, shipping_fee, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, payment_method, address, phone, uploaded_file, shipping_fee, order_total]
        );
        const order_id = orderResult.insertId;
        for (const item of itemsArr) {
            await db.query(
                'INSERT INTO order_items (order_id, product_id, product_name, size, color, quantity, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [order_id, item.product_id, item.product_name, item.size, item.color, item.quantity, item.price]
            );
            
            // Store analytics data independently
            const total_amount = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
            await db.query(
                'INSERT INTO sales_analytics (product_id, product_name, quantity, price, total_amount, order_id) VALUES (?, ?, ?, ?, ?, ?)',
                [item.product_id, item.product_name, item.quantity, item.price, total_amount, order_id]
            );
        }
        res.json({ success: true, order_id });
    } catch (err) {
        console.error('Order creation error:', err);
        res.status(500).json({ success: false, message: 'Order creation failed', error: err.message });
    }
});

// List all orders (admin)
router.get('/', async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
        );
        for (const order of orders) {
            const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
            order.items = items;
            // Ensure shipping_fee and total are always numbers and not null
            order.shipping_fee = order.shipping_fee == null ? 0.00 : parseFloat(order.shipping_fee);
            order.total = order.total == null ? 0.00 : parseFloat(order.total);
        }
        res.json({ success: true, orders });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
    }
});

// Get order details (admin)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query(
            'SELECT o.*, u.name as customer_name, u.email as customer_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
            [id]
        );
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        const order = orders[0];
        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch order', error: err.message });
    }
});

// Update order status
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'In Progress', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    try {
        // Check if order exists
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }
        await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

        // If status is Delivered, schedule auto-delete after 30 minutes
        if (status === 'Delivered') {
            setTimeout(async () => {
                try {
                    // Double-check if order still exists and is Delivered
                    const [checkOrders] = await db.query('SELECT * FROM orders WHERE id = ? AND status = ?', [id, 'Delivered']);
                    if (checkOrders.length > 0) {
                        await db.query('DELETE FROM orders WHERE id = ?', [id]);
                        // Related order_items will be deleted via ON DELETE CASCADE
                    }
                } catch (err) {
                    console.error('Auto-delete error for order', id, err);
                }
            }, 30 * 60 * 1000); // 30 minutes
        }

        res.json({ success: true, message: 'Order status updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update order status', error: err.message });
    }
});

// Delete order (admin/manual)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check if order exists
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found or already deleted.' });
        }
        // Note: We don't delete from sales_analytics to preserve analytics data
        await db.query('DELETE FROM orders WHERE id = ?', [id]);
        // Related order_items will be deleted via ON DELETE CASCADE
        res.json({ success: true, message: 'Order deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to delete order', error: err.message });
    }
});

module.exports = router; 