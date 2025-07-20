const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Error fetching categories' });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, message: 'Error fetching category' });
    }
});

// Create new category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        // Check if category already exists
        const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const [result] = await db.query('INSERT INTO categories (name) VALUES (?)', [name.trim()]);
        res.status(201).json({ 
            success: true, 
            message: 'Category created successfully',
            data: { id: result.insertId, name: name.trim() }
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ success: false, message: 'Error creating category' });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const { id } = req.params;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        // Check if category exists
        const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if new name already exists (excluding current category)
        const [nameExists] = await db.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
        if (nameExists.length > 0) {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }

        await db.query('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), id]);
        res.json({ 
            success: true, 
            message: 'Category updated successfully',
            data: { id: parseInt(id), name: name.trim() }
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'Error updating category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if category exists
        const [existing] = await db.query('SELECT id FROM categories WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if category has products
        const [products] = await db.query('SELECT id FROM products WHERE category_id = ?', [id]);
        if (products.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete category. It has associated products.' 
            });
        }

        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Error deleting category' });
    }
});

// Delete multiple categories
router.delete('/', async (req, res) => {
    try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'Category IDs are required' });
        }

        // Check if categories have products
        const [products] = await db.query('SELECT category_id FROM products WHERE category_id IN (?)', [ids]);
        if (products.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete categories. Some have associated products.' 
            });
        }

        await db.query('DELETE FROM categories WHERE id IN (?)', [ids]);
        res.json({ success: true, message: 'Categories deleted successfully' });
    } catch (error) {
        console.error('Error deleting categories:', error);
        res.status(500).json({ success: false, message: 'Error deleting categories' });
    }
});

module.exports = router; 