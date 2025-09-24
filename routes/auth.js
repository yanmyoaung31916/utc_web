// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { body, validationResult } = require('express-validator');
// const { authenticateToken } = require('../middleware/auth');

// const router = express.Router();

// // Login endpoint
// router.post('/login', [
//   body('username').notEmpty().withMessage('Username is required'),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
// ], async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password } = req.body;

//     // Check credentials (in production, use a database)
//     const adminUsername = process.env.ADMIN_USERNAME || 'admin';
//     const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

//     if (username !== adminUsername) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // For simplicity, we're using plain text comparison
//     // In production, you should hash the password and compare
//     if (password !== adminPassword) {
//       return res.status(401).json({ error: 'Invalid credentials' });
//     }

//     // Generate JWT token
//     const token = jwt.sign(
//       { username, role: 'admin' },
//       process.env.JWT_SECRET || 'fallback-secret',
//       { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
//     );

//     res.json({
//       message: 'Login successful',
//       token,
//       user: { username, role: 'admin' }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // Verify token endpoint
// router.get('/verify', authenticateToken, (req, res) => {
//   res.json({
//     valid: true,
//     user: req.user
//   });
// });

// // Logout endpoint (client-side token removal)
// router.post('/logout', (req, res) => {
//   res.json({ message: 'Logout successful' });
// });

// module.exports = router;



const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Login endpoint
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // 🔑 DB lookup
      const user = await User.findByUsername(username);
      if (!user || !(await User.validatePassword(user, password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role || 'admin' },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, role: user.role || 'admin' },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
  });
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
