const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required.' });
    }
    try {
        const [admins] = await db.query('SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]);
        if (admins.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }
        const admin = admins[0];
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }
        
        // Update last login
        await db.query('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);
        
        const adminData = { 
            id: admin.id, 
            name: admin.name, 
            email: admin.email, 
            role: admin.role,
            profile_photo: admin.profile_photo
        };
        const token = jwt.sign(adminData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ success: true, admin: adminData, token });
    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
});

// Get current admin (from token)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const [admins] = await db.query('SELECT id, name, email, role, profile_photo, last_login, created_at FROM admins WHERE id = ?', [req.user.id]);
        if (admins.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        res.json({ success: true, admin: admins[0] });
    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ success: false, message: 'Error fetching admin' });
    }
});

// Get all admins (super admin only)
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Check if current admin is super admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Super admin required.' });
        }
        
        const [admins] = await db.query(`
            SELECT id, name, email, role, profile_photo, is_active, last_login, created_at 
            FROM admins 
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: admins });
    } catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: 'Error fetching admins' });
    }
});

// Create new admin (super admin only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Check if current admin is super admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Super admin required.' });
        }
        
        const { name, email, password, role = 'admin' } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        
        if (!['admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        
        // Check if email already exists
        const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        
        const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const [result] = await db.query(
            'INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, password_hash, role]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Admin created successfully',
            data: { id: result.insertId, name, email, role }
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ success: false, message: 'Error creating admin' });
    }
});

// Update admin profile (own profile or super admin)
router.put('/profile', authMiddleware, upload.single('profile_photo'), async (req, res) => {
    try {
        const { name, email, current_password, new_password } = req.body;
        const adminId = req.user.id;
        
        // Get current admin data
        const [admins] = await db.query('SELECT * FROM admins WHERE id = ?', [adminId]);
        if (admins.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        const admin = admins[0];
        
        // Validate current password if changing password
        if (new_password) {
            if (!current_password) {
                return res.status(400).json({ success: false, message: 'Current password is required to change password' });
            }
            const match = await bcrypt.compare(current_password, admin.password_hash);
            if (!match) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }
        }
        
        // Check if email already exists (if changing email)
        if (email && email !== admin.email) {
            const [existing] = await db.query('SELECT id FROM admins WHERE email = ? AND id != ?', [email, adminId]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
        }
        
        // Prepare update data
        let updateData = {};
        let updateFields = [];
        let updateValues = [];
        
        if (name && name !== admin.name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        
        if (email && email !== admin.email) {
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        
        if (new_password) {
            const password_hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
            updateFields.push('password_hash = ?');
            updateValues.push(password_hash);
        }
        
        // Handle profile photo upload
        if (req.file) {
            updateFields.push('profile_photo = ?');
            updateValues.push(req.file.filename);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No changes to update' });
        }
        
        updateValues.push(adminId);
        
        await db.query(`UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully',
            data: { 
                name: name || admin.name, 
                email: email || admin.email,
                profile_photo: req.file ? req.file.filename : admin.profile_photo
            }
        });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

// Update admin (super admin only)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        // Check if current admin is super admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Super admin required.' });
        }
        
        const { id } = req.params;
        const { name, email, role, is_active } = req.body;
        
        // Check if admin exists
        const [existing] = await db.query('SELECT id FROM admins WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        // Prevent super admin from deactivating themselves
        if (parseInt(id) === req.user.id && is_active === false) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
        }
        
        let updateFields = [];
        let updateValues = [];
        
        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        
        if (email) {
            // Check if email already exists
            const [emailExists] = await db.query('SELECT id FROM admins WHERE email = ? AND id != ?', [email, id]);
            if (emailExists.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already exists' });
            }
            updateFields.push('email = ?');
            updateValues.push(email);
        }
        
        if (role && ['admin', 'super_admin'].includes(role)) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }
        
        if (typeof is_active === 'boolean') {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No changes to update' });
        }
        
        updateValues.push(id);
        
        await db.query(`UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);
        
        res.json({ 
            success: true, 
            message: 'Admin updated successfully'
        });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ success: false, message: 'Error updating admin' });
    }
});

// Delete admin (super admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Check if current admin is super admin
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Super admin required.' });
        }
        
        const { id } = req.params;
        
        // Prevent super admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }
        
        // Check if admin exists
        const [existing] = await db.query('SELECT id FROM admins WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }
        
        await db.query('DELETE FROM admins WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ success: false, message: 'Error deleting admin' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router; 