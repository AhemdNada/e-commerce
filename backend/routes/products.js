const express = require('express');
const router = express.Router();
const db = require('../config/database');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Test endpoint
router.get('/test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT COUNT(*) as count FROM products');
        res.json({ success: true, count: rows[0].count });
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({ success: false, message: 'Test failed' });
    }
});

// Get all products with category and colors info
router.get('/', async (req, res) => {
    try {
        const { category, gender, search, minPrice, maxPrice, sortBy = 'newest' } = req.query;
        
        let whereConditions = [];
        let queryParams = [];
        
        // Category filter
        if (category) {
            whereConditions.push('c.name = ?');
            queryParams.push(category);
        }
        
        // Gender filter
        if (gender && gender !== 'all') {
            whereConditions.push('p.gender = ?');
            queryParams.push(gender.charAt(0).toUpperCase() + gender.slice(1));
        }
        
        // Search filter
        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Price filter
        if (minPrice) {
            whereConditions.push('p.price >= ?');
            queryParams.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            whereConditions.push('p.price <= ?');
            queryParams.push(parseFloat(maxPrice));
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        // Sort options
        let orderBy = 'p.created_at DESC';
        switch (sortBy) {
            case 'price-low':
                orderBy = 'p.price ASC';
                break;
            case 'price-high':
                orderBy = 'p.price DESC';
                break;
            case 'name':
                orderBy = 'p.name ASC';
                break;
            case 'newest':
            default:
                orderBy = 'p.created_at DESC';
                break;
        }
        
        console.log('Query params:', queryParams);
        console.log('Where clause:', whereClause);
        console.log('Order by:', orderBy);
        
        const query = `
            SELECT 
                p.*,
                c.name as category_name,
                GROUP_CONCAT(DISTINCT col.name) as colors,
                COUNT(DISTINCT ci.id) as total_images,
                COUNT(DISTINCT pc.color_id) as color_count,
                (SELECT ci2.image_path 
                 FROM color_images ci2 
                 WHERE ci2.product_id = p.id 
                 ORDER BY ci2.image_order ASC 
                 LIMIT 1) as first_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors col ON pc.color_id = col.id
            LEFT JOIN color_images ci ON p.id = ci.product_id
            ${whereClause}
            GROUP BY p.id
            ORDER BY ${orderBy}
        `;
        
        console.log('SQL Query:', query);
        
        const [rows] = await db.query(query, queryParams);
        
        console.log('Query result:', rows);
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Get products with pagination
router.get('/page/:page', async (req, res) => {
    try {
        const { page = 1 } = req.params;
        const { category, gender, search, minPrice, maxPrice, sortBy = 'newest', limit = 20 } = req.query;
        
        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let whereConditions = [];
        let queryParams = [];
        
        // Category filter
        if (category) {
            whereConditions.push('c.name = ?');
            queryParams.push(category);
        }
        
        // Gender filter
        if (gender && gender !== 'all') {
            whereConditions.push('p.gender = ?');
            queryParams.push(gender.charAt(0).toUpperCase() + gender.slice(1));
        }
        
        // Search filter
        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }
        
        // Price filter
        if (minPrice) {
            whereConditions.push('p.price >= ?');
            queryParams.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            whereConditions.push('p.price <= ?');
            queryParams.push(parseFloat(maxPrice));
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        // Sort options
        let orderBy = 'p.created_at DESC';
        switch (sortBy) {
            case 'price-low':
                orderBy = 'p.price ASC';
                break;
            case 'price-high':
                orderBy = 'p.price DESC';
                break;
            case 'name':
                orderBy = 'p.name ASC';
                break;
            case 'newest':
            default:
                orderBy = 'p.created_at DESC';
                break;
        }
        
        // Get total count
        const [countResult] = await db.query(`
            SELECT COUNT(DISTINCT p.id) as total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
        `, queryParams);
        
        const totalProducts = countResult[0].total;
        const totalPages = Math.ceil(totalProducts / parseInt(limit));
        
        // Get products for current page
        const [rows] = await db.query(`
            SELECT 
                p.*,
                c.name as category_name,
                GROUP_CONCAT(DISTINCT col.name) as colors,
                COUNT(DISTINCT ci.id) as total_images,
                COUNT(DISTINCT pc.color_id) as color_count,
                (SELECT ci2.image_path 
                 FROM color_images ci2 
                 WHERE ci2.product_id = p.id 
                 ORDER BY ci2.image_order ASC 
                 LIMIT 1) as first_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors col ON pc.color_id = col.id
            LEFT JOIN color_images ci ON p.id = ci.product_id
            ${whereClause}
            GROUP BY p.id
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), offset]);
        
        res.json({ 
            success: true, 
            data: rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalProducts,
                hasNextPage: parseInt(page) < totalPages,
                hasPrevPage: parseInt(page) > 1
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Error fetching products' });
    }
});

// Get single product with all details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get product details
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);
        
        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        const product = products[0];
        
        // Get product sizes
        const [sizes] = await db.query('SELECT * FROM product_sizes WHERE product_id = ?', [id]);
        
        // Get product colors with images
        const [colors] = await db.query(`
            SELECT 
                c.id, c.name, c.hex_code,
                GROUP_CONCAT(ci.image_path ORDER BY ci.image_order) as images,
                COUNT(ci.id) as image_count,
                GROUP_CONCAT(ci.id ORDER BY ci.image_order) as image_ids
            FROM product_colors pc
            JOIN colors c ON pc.color_id = c.id
            LEFT JOIN color_images ci ON pc.product_id = ci.product_id AND pc.color_id = ci.color_id
            WHERE pc.product_id = ?
            GROUP BY c.id
        `, [id]);
        
        product.sizes = sizes;
        product.colors = colors;
        product.total_images = colors.reduce((total, color) => total + (color.image_count || 0), 0);
        product.color_count = colors.length;
        product.has_images = product.total_images > 0;
        
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Error fetching product' });
    }
});

// Create new product
router.post('/', upload.array('images', 50), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { 
            name, 
            description, 
            price, 
            discount_price, 
            gender, 
            category_id, 
            size_type,
            sizes,
            colors
        } = req.body;
        
        // Validation
        if (!name || !price || !gender || !category_id || !size_type) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, price, gender, category, and size type are required' 
            });
        }
        
        if (!['Men', 'Women', 'Unisex'].includes(gender)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Gender must be Men, Women, or Unisex' 
            });
        }
        
        if (!['numeric', 'string'].includes(size_type)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Size type must be numeric or string' 
            });
        }
        
        // Check if category exists
        const [category] = await connection.query('SELECT id FROM categories WHERE id = ?', [category_id]);
        if (category.length === 0) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }
        
        // Create product
        const [productResult] = await connection.query(`
            INSERT INTO products (name, description, price, discount_price, gender, category_id, size_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, description, price, discount_price || null, gender, category_id, size_type]);
        
        const productId = productResult.insertId;
        
        // Add sizes
        if (sizes) {
            const sizesArray = JSON.parse(sizes);
            for (const size of sizesArray) {
                await connection.query(`
                    INSERT INTO product_sizes (product_id, size_value, stock_quantity)
                    VALUES (?, ?, ?)
                `, [productId, size.value, size.quantity || 0]);
            }
        }
        
        // Add colors
        if (colors) {
            const colorsArray = JSON.parse(colors);
            for (const color of colorsArray) {
                await connection.query(`
                    INSERT INTO product_colors (product_id, color_id)
                    VALUES (?, ?)
                `, [productId, color.id]);
            }
        }
        
        // Handle images
        if (req.files && req.files.length > 0) {
            const colorImages = JSON.parse(colors || '[]');
            
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const colorId = req.body[`color_${i}`];
                const imageOrder = req.body[`order_${i}`] || 0;
                
                if (colorId) {
                    await connection.query(`
                        INSERT INTO color_images (product_id, color_id, image_path, image_order)
                        VALUES (?, ?, ?, ?)
                    `, [productId, colorId, file.filename, imageOrder]);
                }
            }
        }
        
        await connection.commit();
        
        res.status(201).json({ 
            success: true, 
            message: 'Product created successfully',
            data: { id: productId }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error creating product:', error);
        res.status(500).json({ success: false, message: 'Error creating product' });
    } finally {
        connection.release();
    }
});

// Update product
router.put('/:id', upload.array('images', 50), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { 
            name, 
            description, 
            price, 
            discount_price, 
            gender, 
            category_id, 
            size_type,
            sizes,
            colors
        } = req.body;
        
        // Check if product exists
        const [existing] = await connection.query('SELECT id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Update product
        await connection.query(`
            UPDATE products 
            SET name = ?, description = ?, price = ?, discount_price = ?, 
                gender = ?, category_id = ?, size_type = ?
            WHERE id = ?
        `, [name, description, price, discount_price || null, gender, category_id, size_type, id]);
        
        // Update sizes
        if (sizes) {
            // Delete existing sizes
            await connection.query('DELETE FROM product_sizes WHERE product_id = ?', [id]);
            
            // Add new sizes
            const sizesArray = JSON.parse(sizes);
            for (const size of sizesArray) {
                await connection.query(`
                    INSERT INTO product_sizes (product_id, size_value, stock_quantity)
                    VALUES (?, ?, ?)
                `, [id, size.value, size.quantity || 0]);
            }
        }
        
        // Update colors
        if (colors) {
            // Delete existing colors
            await connection.query('DELETE FROM product_colors WHERE product_id = ?', [id]);
            
            // Add new colors
            const colorsArray = JSON.parse(colors);
            for (const color of colorsArray) {
                await connection.query(`
                    INSERT INTO product_colors (product_id, color_id)
                    VALUES (?, ?)
                `, [id, color.id]);
            }
        }
        
        // Only delete existing images if new images are uploaded
        if (req.files && req.files.length > 0) {
            // Get the colors that have new images uploaded
            const colorsWithNewImages = new Set();
            for (let i = 0; i < req.files.length; i++) {
                const colorId = req.body[`color_${i}`];
                if (colorId) {
                    colorsWithNewImages.add(colorId);
                }
            }
            
            // Delete existing images only for colors that have new images
            for (const colorId of colorsWithNewImages) {
                await connection.query('DELETE FROM color_images WHERE product_id = ? AND color_id = ?', [id, colorId]);
            }
        }
        
        // Handle new images
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const colorId = req.body[`color_${i}`];
                const imageOrder = req.body[`order_${i}`] || 0;
                
                if (colorId) {
                    await connection.query(`
                        INSERT INTO color_images (product_id, color_id, image_path, image_order)
                        VALUES (?, ?, ?, ?)
                    `, [id, colorId, file.filename, imageOrder]);
                }
            }
        }
        
        await connection.commit();
        
        let updateMessage = 'Product updated successfully';
        if (req.files && req.files.length > 0) {
            const newImageCount = req.files.length;
            updateMessage = `Product updated successfully with ${newImageCount} new image${newImageCount > 1 ? 's' : ''}`;
        } else {
            updateMessage = 'Product updated successfully (existing images preserved)';
        }
            
        res.json({ 
            success: true, 
            message: updateMessage
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, message: 'Error updating product' });
    } finally {
        connection.release();
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if product exists
        const [existing] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        
        // Get images to delete from filesystem
        const [images] = await db.query('SELECT image_path FROM color_images WHERE product_id = ?', [id]);
        
        // Delete from database (cascade will handle related records)
        await db.query('DELETE FROM products WHERE id = ?', [id]);
        
        // Delete image files
        for (const image of images) {
            const imagePath = path.join(__dirname, '../uploads', image.image_path);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
});

// Delete product image
router.delete('/:id/images/:imageId', async (req, res) => {
    try {
        const { id, imageId } = req.params;
        
        // Get image details
        const [images] = await db.query(`
            SELECT image_path FROM color_images 
            WHERE id = ? AND product_id = ?
        `, [imageId, id]);
        
        if (images.length === 0) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        // Delete from database
        await db.query('DELETE FROM color_images WHERE id = ?', [imageId]);
        
        // Delete file
        const imagePath = path.join(__dirname, '../uploads', images[0].image_path);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
        
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ success: false, message: 'Error deleting image' });
    }
});

module.exports = router; 