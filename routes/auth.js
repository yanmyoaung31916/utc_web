const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authLimiter, validateInput } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Login endpoint with enhanced security
router.post(
  '/login',
  authLimiter,
  validateInput,
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .isLength({ max: 128 })
      .withMessage('Password must be less than 128 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Find user
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if account is locked
      if (await User.isAccountLocked(user)) {
        return res.status(423).json({ 
          error: 'Account is temporarily locked due to too many failed login attempts',
          lockedUntil: user.lockedUntil
        });
      }

      // Validate password
      const isValidPassword = await User.validatePassword(user, password);
      if (!isValidPassword) {
        // Increment login attempts
        const attempts = (user.loginAttempts || 0) + 1;
        let lockUntil = null;
        
        if (attempts >= 5) {
          // Lock account for 30 minutes
          lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        }
        
        await User.updateLoginAttempts(username, attempts, lockUntil);
        
        return res.status(401).json({ 
          error: 'Invalid credentials',
          remainingAttempts: Math.max(0, 5 - attempts)
        });
      }

      // Reset login attempts and update last login
      await User.updateLastLogin(username);

      // Generate JWT with enhanced payload
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
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
