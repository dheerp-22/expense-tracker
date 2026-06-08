const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const year = req.query.year || now.getFullYear();
  const month = req.query.month || (now.getMonth() + 1);
  const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  try {
    // Current month totals
    const monthTotals = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as total_income
      FROM expenses WHERE user_id=$1 AND date BETWEEN $2 AND $3 AND deleted_at IS NULL
    `, [userId, startDate, endDate]);

    // Category breakdown
    const categoryBreakdown = await pool.query(`
      SELECT c.name, c.icon, c.color, COALESCE(SUM(e.amount), 0) as total
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id=$1 AND e.date BETWEEN $2 AND $3 AND e.deleted_at IS NULL AND e.type='expense'
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY total DESC LIMIT 8
    `, [userId, startDate, endDate]);

    // Monthly trend (last 6 months)
    const monthlyTrend = await pool.query(`
      SELECT 
        TO_CHAR(date, 'Mon') as month,
        TO_CHAR(date, 'YYYY-MM') as month_key,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income
      FROM expenses 
      WHERE user_id=$1 AND deleted_at IS NULL
        AND date >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY TO_CHAR(date, 'Mon'), TO_CHAR(date, 'YYYY-MM')
      ORDER BY month_key ASC
    `, [userId]);

    // Account balances
    const accounts = await pool.query(
      'SELECT id, name, account_type, balance, color, icon FROM accounts WHERE user_id=$1 AND deleted_at IS NULL ORDER BY balance DESC',
      [userId]
    );

    // Borrow summary
    const borrowSummary = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='borrow' AND status!='settled' THEN amount - settled_amount  ELSE 0 END), 0) as you_owe,
        COALESCE(SUM(CASE WHEN type='lend' AND status!='settled' THEN amount - settled_amount  ELSE 0 END), 0) as owed_to_you
      FROM borrow_transactions WHERE user_id=$1 AND deleted_at IS NULL
    `, [userId]);

    // Recent transactions
    const recentExpenses = await pool.query(`
      SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color, a.name as account_name
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN accounts a ON e.account_id = a.id
      WHERE e.user_id=$1 AND e.deleted_at IS NULL
      ORDER BY e.date DESC, e.created_at DESC LIMIT 8
    `, [userId]);

    res.json({
      month: { year, month },
      totals: monthTotals.rows[0],
      categoryBreakdown: categoryBreakdown.rows,
      monthlyTrend: monthlyTrend.rows,
      accounts: accounts.rows,
      borrowSummary: borrowSummary.rows[0],
      recentExpenses: recentExpenses.rows
    });
  } catch (err) {
  console.error('DASHBOARD ERROR:', err);

  res.status(500).json({
    error: err.message,
    code: err.code,
    detail: err.detail
  });

  }
});

// Reports route
router.get('/reports', auth, async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, groupBy = 'month' } = req.query;
  
  const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];
  
  try {
    const byCategory = await pool.query(`
      SELECT c.name, c.icon, c.color, SUM(e.amount) as total, COUNT(*) as count
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id=$1 AND e.date BETWEEN $2 AND $3 AND e.deleted_at IS NULL AND e.type='expense'
      GROUP BY c.id, c.name, c.icon, c.color ORDER BY total DESC
    `, [userId, start, end]);

    const byAccount = await pool.query(`
      SELECT a.name, a.icon, a.color, SUM(e.amount) as total, COUNT(*) as count
      FROM expenses e
      JOIN accounts a ON e.account_id = a.id
      WHERE e.user_id=$1 AND e.date BETWEEN $2 AND $3 AND e.deleted_at IS NULL AND e.type='expense'
      GROUP BY a.id, a.name, a.icon, a.color ORDER BY total DESC
    `, [userId, start, end]);

    const byMonth = await pool.query(`
      SELECT TO_CHAR(date, 'Mon YYYY') as period, TO_CHAR(date,'YYYY-MM') as key,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income
      FROM expenses WHERE user_id=$1 AND date BETWEEN $2 AND $3 AND deleted_at IS NULL
      GROUP BY TO_CHAR(date,'Mon YYYY'), TO_CHAR(date,'YYYY-MM') ORDER BY key
    `, [userId, start, end]);

    res.json({ byCategory: byCategory.rows, byAccount: byAccount.rows, byMonth: byMonth.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
