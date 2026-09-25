-- FinWise AI - Complete Database Schema
-- Copy-paste all of this into Supabase SQL Editor

-- 1. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('income', 'expense')),
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable', 'other')),
  date DATE NOT NULL,
  payment_method TEXT,
  notes TEXT,
  is_ai_categorized BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. BUDGETS TABLE
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  spent_amount DECIMAL(12, 2) DEFAULT 0,
  month DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. GOALS TABLE
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  deadline DATE,
  category TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 5. FORECASTS TABLE
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  forecast_month DATE NOT NULL,
  expected_income DECIMAL(12, 2),
  expected_fixed_expenses DECIMAL(12, 2),
  expected_variable_expenses DECIMAL(12, 2),
  projected_savings DECIMAL(12, 2),
  confidence_score INT DEFAULT 80,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 6. AI INSIGHTS TABLE
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data_json JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 7. CHAT HISTORY TABLE
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT,
  message_type TEXT DEFAULT 'text',
  created_at TIMESTAMP DEFAULT now()
);

-- 8. FILE UPLOADS TABLE
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  storage_path TEXT,
  extracted_data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can see own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can see own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can see own budgets" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can see own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can see own forecasts" ON forecasts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can see own insights" ON ai_insights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can see own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can see own files" ON file_uploads
  FOR SELECT USING (auth.uid() = user_id);

-- Create Indexes for better performance
CREATE INDEX transactions_user_date ON transactions(user_id, date);
CREATE INDEX transactions_category ON transactions(category);
CREATE INDEX budgets_user_month ON budgets(user_id, month);
CREATE INDEX forecasts_user_month ON forecasts(user_id, forecast_month);
CREATE INDEX chat_history_user_time ON chat_history(user_id, created_at);

-- Create VIEW for Dashboard Stats
CREATE VIEW user_financial_summary AS
SELECT 
  u.id,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) as total_expenses,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) as net_savings,
  COUNT(DISTINCT t.id) as transaction_count
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', now())
GROUP BY u.id;
