const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Simple login (for admin)
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || 'Naitik';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Naitik@123';
    const normalizedUsername = String(username || '').trim();
    const normalizedPassword = String(password || '').trim();

    if (!normalizedUsername || !normalizedPassword) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    if (normalizedUsername !== adminUsername) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (normalizedPassword !== adminPassword) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { role: 'admin', username: adminUsername, timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      expires: '7d'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

router.get('/verify', verifyToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
