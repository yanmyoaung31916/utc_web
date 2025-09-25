const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
  authenticateToken, 
  requireAdmin, 
  userManagementLimiter, 
  validateInput 
} = require('../middleware/auth');
const User = require('../models/User');
const { createOtp, findValidOtp, consumeOtp } = require('../services/otp');
const { sendMail, otpEmailTemplate } = require('../services/email');

const router = express.Router();

// Apply rate limiting and input validation to all routes
router.use(userManagementLimiter);
router.use(validateInput);

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user by ID (Admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, loginAttempts, lockedUntil, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create new user (Admin only)
// INITIATE create admin/user (admin only) -> if role is admin, require OTP
router.post('/', 
  authenticateToken, 
  requireAdmin,
  [
    body('username')
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .isLength({ max: 128 })
      .withMessage('Password must be less than 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('role')
      .isIn(['admin', 'user'])
      .withMessage('Role must be either admin or user'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, role, email, firstName, lastName } = req.body;

      // Check if username already exists
      if (await User.checkUsernameExists(username)) {
        return res.status(409).json({ error: 'Username already exists!' });
      }

      // Check if email already exists      
      if (await User.checkEmailExists(email)) {
        return res.status(409).json({ error: 'Email already exists!' });
      }

      // If creating admin, send OTP and require verification
      if (role === 'admin') {
        const targetEmail = process.env.ADMIN_EMAIL || 'yanmyoaung31916@gmail.com';;
        const otp = await createOtp({
          email: targetEmail,
          actionType: 'create_admin',
          payload: { username, password, role, email, firstName, lastName }
        });

        await sendMail({ to: targetEmail, subject: 'UTC Admin OTP Code', html: otpEmailTemplate(otp.code) });

        return res.status(202).json({
          message: 'OTP sent to admin email for verification',
          otpId: otp.id
        });
      }

      // Non-admin user can be created immediately
      const newUser = await User.create({ username, password, role, email, firstName, lastName });
      res.status(201).json({ message: 'User created successfully', user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName } });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// VERIFY create admin with OTP
router.post('/verify/create-admin', authenticateToken, requireAdmin, [
  body('otpId').isInt().withMessage('otpId is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { otpId, code } = req.body;
    const record = await findValidOtp(otpId, code);
    if (!record || record.actionType !== 'create_admin') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const payload = JSON.parse(record.payload);
    const newUser = await User.create(payload);
    await consumeOtp(otpId);

    return res.json({ message: 'Admin created successfully', user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email, firstName: newUser.firstName, lastName: newUser.lastName } });
  } catch (error) {
    console.error('Error verifying admin creation:', error);
    res.status(500).json({ error: 'Failed to verify admin creation' });
  }
});

// Update user (Admin only)
// INITIATE update (if target user role is admin OR role being changed to admin) -> OTP
router.put('/:id',
  authenticateToken,
  requireAdmin,
  [
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('role')
      .optional()
      .isIn(['admin', 'user'])
      .withMessage('Role must be either admin or user'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Valid user ID is required' });
      }

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check for username conflicts
      if (updateData.username && updateData.username !== existingUser.username) {
        if (await User.checkUsernameExists(updateData.username, id)) {
          return res.status(409).json({ error: 'Username already exists' });
        }
      }

      // Check for email conflicts
      if (updateData.email && updateData.email !== existingUser.email) {
        if (await User.checkEmailExists(updateData.email, id)) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Remove password from update data (use separate endpoint for password changes)
      delete updateData.password;
      delete updateData.passwordHash;

      const targetIsAdmin = existingUser.role === 'admin' || updateData.role === 'admin';
      if (targetIsAdmin) {
        // const targetEmail = existingUser.email || 'yanmyoaung31916@gmail.com';
        const targetEmail = process.env.ADMIN_EMAIL || 'yanmyoaung31916@gmail.com';
        const otp = await createOtp({
          email: targetEmail,
          actionType: 'update_admin',
          payload: { id: parseInt(id), updateData }
        });
        await sendMail({ to: targetEmail, subject: 'UTC Admin OTP Code', html: otpEmailTemplate(otp.code) });
        return res.status(202).json({ message: 'OTP sent for admin update', otpId: otp.id });
      }

      const result = await User.update(id, updateData);
      if (result.changes === 0) return res.status(400).json({ error: 'No changes made' });
      res.json({ message: 'User updated successfully', user: { id: parseInt(id), ...updateData } });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// VERIFY update admin with OTP
router.post('/verify/update-admin', authenticateToken, requireAdmin, [
  body('otpId').isInt().withMessage('otpId is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { otpId, code } = req.body;
    const record = await findValidOtp(otpId, code);
    if (!record || record.actionType !== 'update_admin') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    const payload = JSON.parse(record.payload);
    const result = await User.update(payload.id, payload.updateData);
    await consumeOtp(otpId);
    if (result.changes === 0) return res.status(400).json({ error: 'No changes made' });
    res.json({ message: 'Admin updated successfully', user: { id: payload.id, ...payload.updateData } });
  } catch (error) {
    console.error('Error verifying admin update:', error);
    res.status(500).json({ error: 'Failed to verify admin update' });
  }
});

// Update user password (Admin only)
// INITIATE update password (admin target) -> OTP
router.put('/:id/password',
  authenticateToken,
  requireAdmin,
  [
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .isLength({ max: 128 })
      .withMessage('Password must be less than 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { newPassword } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Valid user ID is required' });
      }

      // Check if user exists
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (existingUser.role === 'admin') {
        const targetEmail = process.env.ADMIN_EMAIL || 'yanmyoaung31916@gmail.com';
        const otp = await createOtp({
          email: targetEmail,
          actionType: 'update_admin_password',
          payload: { id: parseInt(id), newPassword }
        });
        await sendMail({ to: targetEmail, subject: 'UTC Admin OTP Code', html: otpEmailTemplate(otp.code) });
        return res.status(202).json({ message: 'OTP sent for admin password update', otpId: otp.id });
      }

      await User.updatePassword(id, newPassword);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

// VERIFY update admin password with OTP
router.post('/verify/update-admin-password', authenticateToken, requireAdmin, [
  body('otpId').isInt().withMessage('otpId is required'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid OTP code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { otpId, code } = req.body;
    const record = await findValidOtp(otpId, code);
    if (!record || record.actionType !== 'update_admin_password') {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    const payload = JSON.parse(record.payload);
    await User.updatePassword(payload.id, payload.newPassword);
    await consumeOtp(otpId);
    res.json({ message: 'Admin password updated successfully' });
  } catch (error) {
    console.error('Error verifying admin password update:', error);
    res.status(500).json({ error: 'Failed to verify admin password update' });
  }
});

// Delete user (Admin only) - Soft delete
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await User.delete(id);
    
    if (result.changes === 0) {
      return res.status(400).json({ error: 'User not found or already deleted' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get current user profile (Authenticated users)
router.get('/profile/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    const { passwordHash, loginAttempts, lockedUntil, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update current user profile (Authenticated users)
router.put('/profile/me',
  authenticateToken,
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updateData = req.body;
      const userId = req.user.id;

      // Check for email conflicts
      if (updateData.email) {
        if (await User.checkEmailExists(updateData.email, userId)) {
          return res.status(409).json({ error: 'Email already exists' });
        }
      }

      // Remove fields that users shouldn't be able to update themselves
      delete updateData.username;
      delete updateData.role;
      delete updateData.isActive;
      delete updateData.password;
      delete updateData.passwordHash;

      const result = await User.update(userId, updateData);
      
      if (result.changes === 0) {
        return res.status(400).json({ error: 'No changes made' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: { id: userId, ...updateData }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Change current user password (Authenticated users)
router.put('/profile/password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .isLength({ max: 128 })
      .withMessage('Password must be less than 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await User.validatePassword(user, currentPassword);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

module.exports = router;
