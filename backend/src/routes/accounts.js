const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 AND deleted_at IS NULL ORDER BY is_default DESC, name ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth,
  [body('name').trim().notEmpty(), body('type').isIn(['bank','cash','upi','credit_card','other'])],
  validate,
  async (req, res) => {
    const { name, type, balance = 0, color = '#6366f1', icon = '🏦' } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO accounts (user_id, name, account_type, balance, color, icon) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [req.user.id, name, type, balance, color, icon]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.put('/:id', auth, async (req, res) => {
  const { name, type, balance, color, icon } = req.body;
  try {
    const result = await pool.query(
      `UPDATE accounts SET 
        name = COALESCE($1, name),
        account_type = COALESCE($2, account_type),
        balance = COALESCE($3, balance),
        color = COALESCE($4, color),
        icon = COALESCE($5, icon),
        updated_at = NOW()
       WHERE id = $6 AND user_id = $7 AND deleted_at IS NULL RETURNING *`,
      [name, type, balance, color, icon, req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'UPDATE accounts SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
