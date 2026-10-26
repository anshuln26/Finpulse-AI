-- ==============================================================================
-- FinPulse AI — Complete Supabase PostgreSQL Schema
-- Personalized Financial Health & Investment Recommender
-- Run this in your Supabase SQL Editor (supabase.com -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. PROFILES TABLE
-- Stores user financial profile, monthly income, savings targets, and risk tolerance
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  monthly_income NUMERIC(12, 2) NOT NULL DEFAULT 0,
  savings_goal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  risk_tolerance TEXT NOT NULL DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  investment_horizon_years INTEGER NOT NULL DEFAULT 7,
  emergency_fund_target_months INTEGER NOT NULL DEFAULT 6,
  emergency_fund_current NUMERIC(12, 2) NOT NULL DEFAULT 0,
  existing_investments JSONB NOT NULL DEFAULT '{"equity": 0, "debt": 0, "gold": 0, "cash": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. USER CONSENTS TABLE (GDPR / DPDP Privacy Compliance)
-- Granular consent toggles to control telemetry shared with the AI engine
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  share_transactions BOOLEAN NOT NULL DEFAULT TRUE,
  share_income BOOLEAN NOT NULL DEFAULT TRUE,
  share_investments BOOLEAN NOT NULL DEFAULT TRUE,
  ai_advisory_consent BOOLEAN NOT NULL DEFAULT TRUE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
-- Stores income and expense ledger entries
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  source TEXT,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user data isolation: each user can only read and write their own rows
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- User Consents Policies
DROP POLICY IF EXISTS "Users can view own consent" ON public.user_consents;
CREATE POLICY "Users can view own consent"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consent" ON public.user_consents;
CREATE POLICY "Users can insert own consent"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own consent" ON public.user_consents;
CREATE POLICY "Users can update own consent"
  ON public.user_consents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own consent" ON public.user_consents;
CREATE POLICY "Users can delete own consent"
  ON public.user_consents FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. AUTOMATIC TIMESTAMP TRIGGER
-- Automatically updates updated_at whenever a record is modified
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_consents_updated_at ON public.user_consents;
CREATE TRIGGER trigger_consents_updated_at
  BEFORE UPDATE ON public.user_consents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON public.transactions;
CREATE TRIGGER trigger_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. AUTOMATIC NEW USER INITIALIZATION TRIGGER
-- When a user signs up via Supabase Auth, automatically creates:
--   1. Default financial profile
--   2. Default consent preferences
--   3. Sample financial records so the dashboard & charts are immediately interactive
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- 1. Create Default Profile
  INSERT INTO public.profiles (
    id,
    name,
    monthly_income,
    savings_goal,
    risk_tolerance,
    investment_horizon_years,
    emergency_fund_target_months,
    emergency_fund_current,
    existing_investments
  ) VALUES (
    NEW.id,
    user_full_name,
    85000,
    25000,
    'moderate',
    7,
    6,
    180000,
    '{"equity": 250000, "debt": 120000, "gold": 60000, "cash": 40000}'::jsonb
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Create Default Consent
  INSERT INTO public.user_consents (
    user_id,
    share_transactions,
    share_income,
    share_investments,
    ai_advisory_consent
  ) VALUES (
    NEW.id,
    TRUE,
    TRUE,
    TRUE,
    TRUE
  ) ON CONFLICT (user_id) DO NOTHING;

  -- 3. Seed Starter Transactions for instant rich visual demo
  INSERT INTO public.transactions (user_id, date, description, amount, type, category, payment_method, notes)
  VALUES
    (NEW.id, CURRENT_DATE - INTERVAL '25 days', 'Monthly Salary Credit (Tech Corp)', 85000, 'income', 'Salary', 'Direct Bank Transfer', 'Corporate payroll deposit via NEFT'),
    (NEW.id, CURRENT_DATE - INTERVAL '24 days', '2BHK Apartment Rent', 24000, 'expense', 'Housing', 'Net Banking', 'Essential house rent'),
    (NEW.id, CURRENT_DATE - INTERVAL '20 days', 'Supermarket Grocery & Zepto Pantry', 7200, 'expense', 'Food & Dining', 'UPI', 'Monthly groceries & essentials'),
    (NEW.id, CURRENT_DATE - INTERVAL '15 days', 'Electricity & Water Utility Bills', 3200, 'expense', 'Utilities', 'UPI', 'Monthly power and water utilities'),
    (NEW.id, CURRENT_DATE - INTERVAL '12 days', 'Metro Pass & Fuel Commute', 2800, 'expense', 'Transportation', 'Card', 'Daily commute costs'),
    (NEW.id, CURRENT_DATE - INTERVAL '8 days', 'Weekend Family Dinner Out', 3400, 'expense', 'Food & Dining', 'UPI', 'Dining out at cafe'),
    (NEW.id, CURRENT_DATE - INTERVAL '5 days', 'OTT & Music Subscriptions (Netflix/Spotify)', 1199, 'expense', 'Subscriptions', 'Auto-debit', 'Entertainment subscriptions'),
    (NEW.id, CURRENT_DATE - INTERVAL '3 days', 'Health & Term Insurance Premium', 2500, 'expense', 'Healthcare', 'Net Banking', 'Quarterly medical protection plan');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on every new user sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. STORED PROCEDURES: DATA SOVEREIGNTY (GDPR / DPDP)
-- ==============================================================================

-- A. Wipe User Data (Right to be Forgotten)
-- Deletes all transaction and profile data, and revokes all consent toggles
CREATE OR REPLACE FUNCTION public.wipe_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Unauthorized to wipe data for this user';
  END IF;

  DELETE FROM public.transactions WHERE user_id = target_user_id;
  
  UPDATE public.user_consents
  SET share_transactions = FALSE,
      share_income = FALSE,
      share_investments = FALSE,
      ai_advisory_consent = FALSE,
      last_updated = NOW()
  WHERE user_id = target_user_id;

  UPDATE public.profiles
  SET monthly_income = 0,
      savings_goal = 0,
      emergency_fund_current = 0,
      existing_investments = '{"equity": 0, "debt": 0, "gold": 0, "cash": 0}'::jsonb
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
