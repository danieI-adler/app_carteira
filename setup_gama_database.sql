-- ==============================================================================
-- DESAFIO INTERNO GAMA - SCHEMA COMPLETO E ATIVOS GLOBAIS (ETFs em USD)
-- ==============================================================================
-- Este script configura o banco de dados do Desafio Gama no Supabase.
-- Executar no SQL Editor do novo projeto Supabase.
-- ==============================================================================

-- 1. TABELA DE EQUIPES (Saldo inicial em USD $ 100,000,000.00)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 100000000.00,
    net_worth NUMERIC(15, 2) NOT NULL DEFAULT 100000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 2. TABELA DE PERFIS DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. TABELA DE ATIVOS EXCLUSIVOS (18 ETFs Globais / Setoriais)
CREATE TABLE IF NOT EXISTS public.assets (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'etf',
    last_price NUMERIC(12, 2) NOT NULL,
    chart_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 4. TABELA DE POSIÇÕES EM CUSTÓDIA (PORTFÓLIO)
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    asset_symbol TEXT REFERENCES public.assets(symbol) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    average_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    position_type TEXT NOT NULL DEFAULT 'long' CHECK (position_type IN ('long', 'short')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (team_id, asset_symbol, position_type)
);

ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;

-- 5. TABELA DE ORDENS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    asset_symbol TEXT REFERENCES public.assets(symbol) NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell', 'short', 'cover')),
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
    quantity NUMERIC(12, 4) NOT NULL,
    limit_price NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
    execution_price NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. TABELA DE TRANSAÇÕES (HISTÓRICO)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    asset_symbol TEXT REFERENCES public.assets(symbol) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'short', 'cover')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7. TABELA DE CONFIGURAÇÕES DA COMPETIÇÃO
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS DE RLS PERMISSIVAS
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Public read teams" ON public.teams;
    DROP POLICY IF EXISTS "Admin update teams" ON public.teams;
    DROP POLICY IF EXISTS "Public read assets" ON public.assets;
    DROP POLICY IF EXISTS "Public update assets" ON public.assets;
    DROP POLICY IF EXISTS "Public read portfolio_positions" ON public.portfolio_positions;
    DROP POLICY IF EXISTS "Public update portfolio_positions" ON public.portfolio_positions;
    DROP POLICY IF EXISTS "Public read orders" ON public.orders;
    DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
    DROP POLICY IF EXISTS "Public update orders" ON public.orders;
    DROP POLICY IF EXISTS "Public read transactions" ON public.transactions;
    DROP POLICY IF EXISTS "Public insert transactions" ON public.transactions;
    DROP POLICY IF EXISTS "Public read settings" ON public.system_settings;
END $$;

CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public read teams" ON public.teams FOR ALL USING (true);
CREATE POLICY "Public read assets" ON public.assets FOR ALL USING (true);
CREATE POLICY "Public read portfolio_positions" ON public.portfolio_positions FOR ALL USING (true);
CREATE POLICY "Public read orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Public read transactions" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Public read settings" ON public.system_settings FOR ALL USING (true);

-- 9. CARGA DOS 18 ETFS EXCLUSIVOS DO DESAFIO GAMA
INSERT INTO public.assets (symbol, name, type, last_price, updated_at) VALUES
('SPY', 'ETF do índice de ações S&P 500 (SPDR S&P 500 ETF Trust)', 'etf', 770.19, now()),
('XLB', 'ETF do setor "Basic Materials" do S&P 500 (Materials Select SPDR)', 'etf', 52.44, now()),
('XLE', 'ETF do setor "Energy" do S&P 500 (Energy Select SPDR)', 'etf', 64.06, now()),
('XLF', 'ETF do setor "Financials" do S&P 500 (Financial Select SPDR)', 'etf', 58.10, now()),
('XLI', 'ETF do setor "Industrials" do S&P 500 (Industrial Select SPDR)', 'etf', 175.27, now()),
('XLK', 'ETF do setor "Technology" do S&P 500 (Technology Select SPDR)', 'etf', 187.28, now()),
('XLP', 'ETF do setor "Staples" do S&P 500 (Consumer Staples Select SPDR)', 'etf', 84.58, now()),
('XLU', 'ETF do setor "Utilities" do S&P 500 (Utilities Select SPDR)', 'etf', 43.08, now()),
('XLV', 'ETF do setor "Healthcare" do S&P 500 (Health Care Select SPDR)', 'etf', 171.45, now()),
('XLY', 'ETF do setor "Consumer Discretionary" do S&P 500 (Consumer Disc. SPDR)', 'etf', 114.91, now()),
('XTN', 'ETF do setor "Transportation" do S&P 500 (SPDR S&P Transportation)', 'etf', 105.52, now()),
('EWJ', 'ETF do índice de ações do Japão (iShares MSCI Japan ETF)', 'etf', 98.28, now()),
('EWG', 'ETF do índice de ações da Alemanha (iShares MSCI Germany ETF)', 'etf', 43.89, now()),
('EEM', 'ETF de ações de países emergentes (iShares MSCI Emerging Markets)', 'etf', 68.70, now()),
('EWZ', 'ETF de ações brasileiras (iShares MSCI Brazil ETF)', 'etf', 37.86, now()),
('TLT', 'ETF de "Bonds" americanos Treasury 20+ anos (iShares 20+ Year Treasury)', 'etf', 82.21, now()),
('GLD', 'ETF do Ouro metal precioso (SPDR Gold Shares)', 'etf', 406.77, now()),
('FXE', 'ETF do Euro em relação ao US Dólar (Invesco CurrencyShares Euro)', 'etf', 107.15, now())
ON CONFLICT (symbol) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    last_price = EXCLUDED.last_price,
    updated_at = EXCLUDED.updated_at;
