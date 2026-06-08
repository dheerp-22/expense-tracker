const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');
const { body, query } = require('express-validator');
const validate = require('../middleware/validate');

// Get expenses with filtering/pagination
router.get('/', auth, async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate, categoryId, accountId, search, type } = req.query;
  const offset = (page - 1) * limit;
  
  let conditions = ['e.user_id = $1', 'e.deleted_at IS NULL'];
  let params = [req.user.id];
  let pIdx = 2;

  if (startDate) { conditions.push(`e.date >= $${pIdx++}`); params.push(startDate); }
  if (endDate)   { conditions.push(`e.date <= $${pIdx++}`); params.push(endDate); }
  if (categoryId){ conditions.push(`e.category_id = $${pIdx++}`); params.push(categoryId); }
  if (accountId) { conditions.push(`e.account_id = $${pIdx++}`); params.push(accountId); }
  if (type)      { conditions.push(`e.type = $${pIdx++}`); params.push(type); }
  if (search)    { conditions.push(`e.title ILIKE $${pIdx++}`); params.push(`%${search}%`); }

  const where = 'WHERE ' + conditions.join(' AND ');
  
  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM expenses e ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);
    
    const result = await pool.query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
              a.name as account_name, a.icon as account_icon
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN accounts a ON e.account_id = a.id
       ${where}
       ORDER BY e.date DESC, e.created_at DESC
       LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
      [...params, limit, offset]
    );
    
    res.json({
      data: result.rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create expense
router.post('/', auth,
  [
    body('title').trim().notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('date').isDate(),
    body('type').optional().isIn(['expense', 'income']),
  ],
  validate,
  async (req, res) => {
    const { title, amount, category_id, account_id, date, notes, type = 'expense' } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO expenses (user_id, title, amount, category_id, account_id, date, notes, type)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.user.id, title, amount, category_id || null, account_id || null, date, notes || null, type]
      );
      
      // Update account balance
      if (account_id) {
        const delta = type === 'expense' ? -amount : amount;
        await pool.query(
          'UPDATE accounts SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3',
          [delta, account_id, req.user.id]
        );
      }
      
      const expense = result.rows[0];
      // Fetch joined data
      const joined = await pool.query(
        `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
                a.name as account_name, a.icon as account_icon
         FROM expenses e
         LEFT JOIN categories c ON e.category_id = c.id
         LEFT JOIN accounts a ON e.account_id = a.id
         WHERE e.id = $1`, [expense.id]
      );
      res.status(201).json(joined.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update expense
router.put('/:id', auth, async (req, res) => {
  const { title, amount, categoryId, accountId, date, notes, type } = req.body;
  try {
    // Get old expense to reverse balance
    const old = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (old.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const oldExp = old.rows[0];
    
    // Reverse old balance effect
    if (oldExp.account_id) {
      const reverseDelta = oldExp.type === 'expense' ? oldExp.amount : -oldExp.amount;
      await pool.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [reverseDelta, oldExp.account_id, req.user.id]);
    }
    
    const result = await pool.query(
      `UPDATE expenses SET title=COALESCE($1,title), amount=COALESCE($2,amount), 
       category_id=COALESCE($3,category_id), account_id=COALESCE($4,account_id),
       date=COALESCE($5,date), notes=COALESCE($6,notes), type=COALESCE($7,type), updated_at=NOW()
       WHERE id=$8 AND user_id=$9 AND deleted_at IS NULL RETURNING *`,
      [title, amount, categoryId, accountId, date, notes, type, req.params.id, req.user.id]
    );
    
    const updated = result.rows[0];
    // Apply new balance effect
    if (updated.account_id) {
      const delta = updated.type === 'expense' ? -updated.amount : updated.amount;
      await pool.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2 AND user_id = $3', [delta, updated.account_id, req.user.id]);
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const old = await pool.query('SELECT * FROM expenses WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL', [req.params.id, req.user.id]);
    if (old.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const exp = old.rows[0];
    
    await pool.query('UPDATE expenses SET deleted_at=NOW() WHERE id=$1', [req.params.id]);
    
    // Reverse balance
    if (exp.account_id) {
      const delta = exp.type === 'expense' ? exp.amount : -exp.amount;
      await pool.query('UPDATE accounts SET balance=balance+$1 WHERE id=$2 AND user_id=$3', [delta, exp.account_id, req.user.id]);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
