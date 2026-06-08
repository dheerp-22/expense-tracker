const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.get('/', auth, async (req, res) => {
  const { status, type } = req.query;
  let conditions = ['user_id = $1', 'deleted_at IS NULL'];
  let params = [req.user.id];
  let pIdx = 2;
  if (status) { conditions.push(`status = $${pIdx++}`); params.push(status); }
  if (type)   { conditions.push(`type = $${pIdx++}`); params.push(type); }
  try {
    const result = await pool.query(
      `SELECT * FROM borrow_transactions WHERE ${conditions.join(' AND ')} ORDER BY date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth,
  [
    body('person_name').trim().notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('type').isIn(['borrow', 'lend']),
    body('date').isDate(),
  ],
  validate,
  async (req, res) => {
    const { person_name, amount, type, date, due_date, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO borrow_transactions (user_id, person_name, amount, type, date, due_date, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.user.id, person_name, amount, type, date, due_date || null, notes || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Add settlement
router.post('/:id/settle', auth,
  [body('amount').isFloat({ min: 0.01 }), body('date').isDate()],
  validate,
  async (req, res) => {
    const { amount, date, notes } = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txn = await client.query(
        'SELECT * FROM borrow_transactions WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
      );
      if (txn.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
      const t = txn.rows[0];
      
      await client.query('INSERT INTO borrow_settlements (transaction_id, amount, date, notes) VALUES ($1,$2,$3,$4)', [t.id, amount, date, notes]);
      
      const newPaid = parseFloat(t.paid_amount) + parseFloat(amount);
      const newStatus = newPaid >= parseFloat(t.amount) ? 'settled' : 'partial';
      
      const updated = await client.query(
        'UPDATE borrow_transactions SET paid_amount=$1, status=$2, updated_at=NOW() WHERE id=$3 RETURNING *',
        [newPaid, newStatus, t.id]
      );
      await client.query('COMMIT');
      res.json(updated.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  }
);

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('UPDATE borrow_transactions SET deleted_at=NOW() WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
