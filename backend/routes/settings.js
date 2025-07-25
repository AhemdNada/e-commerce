const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET shipping value
router.get('/shipping', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT `value` FROM settings WHERE `key` = ?', ['shipping']);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Shipping setting not found' });
        }
        res.json({ success: true, shipping: parseFloat(rows[0].value) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch shipping', error: err.message });
    }
});

// PUT update shipping value
router.put('/shipping', async (req, res) => {
    const { shipping } = req.body;
    if (shipping === undefined || isNaN(Number(shipping))) {
        return res.status(400).json({ success: false, message: 'Invalid shipping value' });
    }
    try {
        const [result] = await db.query('UPDATE settings SET `value` = ? WHERE `key` = ?', [shipping, 'shipping']);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Shipping setting not found' });
        }
        res.json({ success: true, message: 'Shipping updated', shipping: parseFloat(shipping) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update shipping', error: err.message });
    }
});

module.exports = router; 