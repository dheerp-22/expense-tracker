const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../db/pool');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

// Register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const hash = await bcrypt.hash(password, 12);
      const colors = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6'];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];
      
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id, name, email, avatar_color',
        [name, email, hash, avatarColor]
      );
      const user = result.rows[0];

      // Create default categories
      const defaultCategories = [
        { name: 'Food & Dining', icon: '🍔', color: '#f59e0b' },
        { name: 'Transport', icon: '🚗', color: '#3b82f6' },
        { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
        { name: 'Rent & Utilities', icon: '🏠', color: '#10b981' },
        { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
        { name: 'Health', icon: '💊', color: '#ef4444' },
        { name: 'Petrol', icon: '⛽', color: '#f97316' },
        { name: 'Recharge', icon: '📱', color: '#06b6d4' },
      ];
      for (const cat of defaultCategories) {
        await pool.query(
          'INSERT INTO categories (user_id, name, icon, color, is_default) VALUES ($1, $2, $3, $4, TRUE)',
          [user.id, cat.name, cat.icon, cat.color]
        );
      }

      // Create default accounts
      const defaultAccounts = [
        { name: 'Cash', type: 'cash', icon: '💵', color: '#10b981', balance: 0 },
        { name: 'Bank Account', type: 'bank', icon: '🏦', color: '#3b82f6', balance: 0 },
      ];
      for (const acc of defaultAccounts) {
        await pool.query(
          'INSERT INTO accounts (user_id, name, type, icon, color, balance, is_default) VALUES ($1, $2, $3, $4, $5, $6, TRUE)',
          [user.id, acc.name, acc.type, acc.icon, acc.color, acc.balance]
        );
      }

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      console.error('MESSAGE:', error.message);
      console.error('DETAIL:', error.detail);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
      const { password_hash, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_color, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
