const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
// JWT_EXPIRES_IN controls how long tokens are valid. Adjust as needed for your security policy.
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    try {
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const [result] = await db.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, password_hash]);
        const user = { id: result.insertId, name, email };
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ success: true, user, token });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Signup failed', error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required.' });
    }
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Invalid credentials.' });
        }
        const userData = { id: user.id, name: user.name, email: user.email };
        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ success: true, user: userData, token });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
});

// Get current user (from token)
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// Logout (client just deletes token)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out.' });
});

module.exports = router; 