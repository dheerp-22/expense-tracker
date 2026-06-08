const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Get all categories
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category
router.post('/',
  auth,
  [body('name').trim().notEmpty(), body('icon').optional(), body('color').optional()],
  validate,
  async (req, res) => {
    const { name, icon = '📁', color = '#6366f1' } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO categories (user_id, name, icon, color) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.user.id, name, icon, color]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update category
router.put('/:id', auth, async (req, res) => {
  const { name, icon, color } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name = COALESCE($1,name), icon = COALESCE($2,icon), color = COALESCE($3,color), updated_at = NOW() WHERE id = $4 AND user_id = $5 AND deleted_at IS NULL RETURNING *',
      [name, icon, color, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE categories SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
