-- =========================================
-- FinTrack Database Schema
-- =========================================

-- Drop tables in dependency order so the
-- schema can be recreated cleanly.
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS investments;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;


-- =========================================
-- Users
-- =========================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- Categories
-- =========================================

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);


-- =========================================
-- Accounts
-- =========================================

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  balance NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  CONSTRAINT fk_accounts_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
);


-- =========================================
-- Transactions
-- =========================================

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  category_id INTEGER NULL,
  description VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_transactions_account
    FOREIGN KEY (account_id)
    REFERENCES accounts(id),

  CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
);


-- =========================================
-- Budgets
-- =========================================

CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  monthly_limit NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_budgets_user
    FOREIGN KEY (user_id)
    REFERENCES users(id),

  CONSTRAINT fk_budgets_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id),

  CONSTRAINT unique_user_category_budget
    UNIQUE (user_id, category_id)
);


-- =========================================
-- Investments
-- =========================================

CREATE TABLE investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  quantity NUMERIC(18, 8) NOT NULL,
  purchase_price NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_investments_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
);


-- =========================================
-- Seed Global Categories
-- =========================================

INSERT INTO categories (name)
VALUES
  ('Salary'),
  ('Groceries'),
  ('Transportation'),
  ('Housing'),
  ('Utilities'),
  ('Dining'),
  ('Entertainment'),
  ('Healthcare'),
  ('Insurance'),
  ('Education'),
  ('Shopping'),
  ('Travel'),
  ('Savings'),
  ('Investments'),
  ('Other');