-- ============================================
-- Expense Tracker Database Schema
-- Compatible with PostgreSQL (Neon / Supabase)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) DEFAULT '💰',
  color VARCHAR(7) DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

CREATE INDEX idx_categories_user ON categories(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('bank', 'cash', 'upi', 'credit_card', 'other')),
  balance DECIMAL(15, 2) DEFAULT 0.00,
  icon VARCHAR(50) DEFAULT '🏦',
  color VARCHAR(7) DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

CREATE INDEX idx_accounts_user ON accounts(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_expenses_user ON expenses(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_date ON expenses(date) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category ON expenses(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_account ON expenses(account_id) WHERE deleted_at IS NULL;

-- ============================================
-- BORROW TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS borrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  person_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  type VARCHAR(10) NOT NULL CHECK (type IN ('borrow', 'lend')),
  status VARCHAR(15) DEFAULT 'pending' CHECK (status IN ('pending', 'settled', 'partial')),
  settled_amount DECIMAL(15, 2) DEFAULT 0.00,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_borrow_user ON borrow_transactions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_borrow_status ON borrow_transactions(status) WHERE deleted_at IS NULL;

-- ============================================
-- TRIGGER: Update updated_at on row change
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER borrow_updated_at BEFORE UPDATE ON borrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- DEFAULT CATEGORIES FUNCTION
-- (called after user registration)
-- ============================================
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, is_default) VALUES
    (p_user_id, 'Food & Dining', '🍽️', '#f97316', TRUE),
    (p_user_id, 'Transport', '🚗', '#3b82f6', TRUE),
    (p_user_id, 'Shopping', '🛍️', '#ec4899', TRUE),
    (p_user_id, 'Rent & Housing', '🏠', '#8b5cf6', TRUE),
    (p_user_id, 'Utilities', '💡', '#eab308', TRUE),
    (p_user_id, 'Healthcare', '🏥', '#ef4444', TRUE),
    (p_user_id, 'Entertainment', '🎬', '#06b6d4', TRUE),
    (p_user_id, 'Education', '📚', '#10b981', TRUE),
    (p_user_id, 'Petrol', '⛽', '#f59e0b', TRUE),
    (p_user_id, 'Recharge', '📱', '#6366f1', TRUE),
    (p_user_id, 'Groceries', '🛒', '#84cc16', TRUE),
    (p_user_id, 'Other', '💰', '#94a3b8', TRUE);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DEFAULT ACCOUNTS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_default_accounts(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO accounts (user_id, name, account_type, balance, icon, color, is_default) VALUES
    (p_user_id, 'Cash', 'cash', 0.00, '💵', '#22c55e', TRUE),
    (p_user_id, 'Bank Account', 'bank', 0.00, '🏦', '#3b82f6', FALSE);
END;
$$ LANGUAGE plpgsql;
