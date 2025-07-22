const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all payment methods (for admin and checkout)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM payment_methods');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch payment methods', error: err.message });
    }
});

// PUT update a payment method by method_name
router.put('/:method_name', async (req, res) => {
    const { method_name } = req.params;
    const { enabled, phone_number, visa_card, email } = req.body;

    // Validation per method
    if (method_name === 'vodafone_cash') {
        if (enabled && (!phone_number || phone_number.trim() === '')) {
            return res.status(400).json({ success: false, message: 'Phone number is required for Vodafone Cash.' });
        }
    } else if (method_name === 'instapay') {
        if (enabled && (!phone_number && !visa_card && !email)) {
            return res.status(400).json({ success: false, message: 'At least one detail (phone, visa, or email) is required for InstaPay.' });
        }
    } else if (method_name === 'cash_on_delivery') {
        // No details required
    } else {
        return res.status(400).json({ success: false, message: 'Invalid payment method.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE payment_methods SET enabled=?, phone_number=?, visa_card=?, email=? WHERE method_name=?',
            [
                enabled ? 1 : 0,
                phone_number || null,
                visa_card || null,
                email || null,
                method_name
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Payment method not found.' });
        }
        res.json({ success: true, message: 'Payment method updated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update payment method', error: err.message });
    }
});

module.exports = router; 