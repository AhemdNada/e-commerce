const jwt = require('jsonwebtoken');
const db = require('../config/database');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if admin exists first (admins have priority)
    const [admins] = await db.query('SELECT id, name, email, role FROM admins WHERE id = ? AND is_active = 1', [decoded.id]);
    if (admins.length > 0) {
      req.user = admins[0];
      req.userType = 'admin';
      return next();
    }
    
    // Check if user exists
    const [users] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.id]);
    if (users.length > 0) {
      req.user = users[0];
      req.userType = 'user';
      return next();
    }
    
    return res.status(401).json({ success: false, message: 'User not found.' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}; 