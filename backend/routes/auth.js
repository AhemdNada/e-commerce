const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = '7d';

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
        const password_hash = await bcrypt.hash(password, 10);
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
router.get('/me', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    try {
        const token = auth.split(' ')[1];
        const user = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, user });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid token.' });
    }
});

// Logout (client just deletes token)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out.' });
});

module.exports = router; 