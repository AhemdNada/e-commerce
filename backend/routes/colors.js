const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all colors
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM colors ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching colors:', error);
        res.status(500).json({ success: false, message: 'Error fetching colors' });
    }
});

// Get single color
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM colors WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Color not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching color:', error);
        res.status(500).json({ success: false, message: 'Error fetching color' });
    }
});

// Create new color
router.post('/', async (req, res) => {
    try {
        const { name, hex_code } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Color name is required' });
        }

        // Check if color already exists
        const [existing] = await db.query('SELECT id FROM colors WHERE name = ?', [name.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Color already exists' });
        }

        const [result] = await db.query('INSERT INTO colors (name, hex_code) VALUES (?, ?)', [name.trim(), hex_code || null]);
        res.status(201).json({ 
            success: true, 
            message: 'Color created successfully',
            data: { id: result.insertId, name: name.trim(), hex_code }
        });
    } catch (error) {
        console.error('Error creating color:', error);
        res.status(500).json({ success: false, message: 'Error creating color' });
    }
});

// Update color
router.put('/:id', async (req, res) => {
    try {
        const { name, hex_code } = req.body;
        const { id } = req.params;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Color name is required' });
        }

        // Check if color exists
        const [existing] = await db.query('SELECT id FROM colors WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Color not found' });
        }

        // Check if new name already exists (excluding current color)
        const [nameExists] = await db.query('SELECT id FROM colors WHERE name = ? AND id != ?', [name.trim(), id]);
        if (nameExists.length > 0) {
            return res.status(400).json({ success: false, message: 'Color name already exists' });
        }

        await db.query('UPDATE colors SET name = ?, hex_code = ? WHERE id = ?', [name.trim(), hex_code || null, id]);
        res.json({ 
            success: true, 
            message: 'Color updated successfully',
            data: { id: parseInt(id), name: name.trim(), hex_code }
        });
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({ success: false, message: 'Error updating color' });
    }
});

// Delete color
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if color exists
        const [existing] = await db.query('SELECT id FROM colors WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Color not found' });
        }

        // Check if color is used in products
        const [products] = await db.query('SELECT id FROM product_colors WHERE color_id = ?', [id]);
        if (products.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete color. It is used in products.' 
            });
        }

        await db.query('DELETE FROM colors WHERE id = ?', [id]);
        res.json({ success: true, message: 'Color deleted successfully' });
    } catch (error) {
        console.error('Error deleting color:', error);
        res.status(500).json({ success: false, message: 'Error deleting color' });
    }
});

module.exports = router; 