-- 20260815000000_initial_schema.sql
-- Schema inicial para a competição de gestão de portfólio (app_carteira)

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA: teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 10000000.00, -- R$ 10.000.000,00 inicial
    net_worth NUMERIC(15, 2) NOT NULL DEFAULT 10000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 2. TABELA: profiles (extensão de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. TABELA: assets
CREATE TABLE IF NOT EXISTS public.assets (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('acao', 'fii', 'etf', 'bdr', 'outro')),
    last_price NUMERIC(12, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 4. TABELA: portfolio_positions
CREATE TABLE IF NOT EXISTS public.portfolio_positions (
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    asset_symbol TEXT REFERENCES public.assets(symbol) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL DEFAULT 0,
    average_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (team_id, asset_symbol, position_type)
);

-- Habilitar RLS para portfolio_positions
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;

-- 5. TABELA: orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    asset_symbol TEXT REFERENCES public.assets(symbol) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell', 'short', 'cover')),
    limit_price NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 6. TABELA: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    asset_symbol TEXT REFERENCES public.assets(symbol),
    quantity NUMERIC(12, 4) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'short', 'cover', 'dividend', 'interest', 'loan_fee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7. TABELA: loans
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0100, -- 1%
    type TEXT NOT NULL CHECK (type IN ('voluntary', 'emergency')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para loans
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- 8. TABELA: system_config
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;


-- POLÍTICAS DE RLS (POLICIES)

-- Políticas para profiles
CREATE POLICY "Permitir que usuários leiam todos os perfis" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Permitir que usuários atualizem seu próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para teams
CREATE POLICY "Permitir leitura pública de equipes" ON public.teams
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção de equipes por qualquer pessoa" ON public.teams
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização de equipes por admins" ON public.teams
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Políticas para assets
CREATE POLICY "Permitir leitura pública de ativos" ON public.assets
    FOR SELECT USING (true);

CREATE POLICY "Permitir modificação de ativos por admins" ON public.assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Políticas para portfolio_positions
CREATE POLICY "Permitir que equipes visualizem suas posições" ON public.portfolio_positions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.team_id = portfolio_positions.team_id
        ) OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Políticas para orders
CREATE POLICY "Permitir que equipes visualizem suas próprias ordens" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.team_id = orders.team_id
        ) OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Permitir que usuários enviem ordens para sua equipe" ON public.orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.team_id = orders.team_id
        )
    );

-- Políticas para transactions
CREATE POLICY "Permitir que equipes visualizem suas transações" ON public.transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.team_id = transactions.team_id
        ) OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Políticas para loans
CREATE POLICY "Permitir que equipes vejam seus empréstimos" ON public.loans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.team_id = loans.team_id
        ) OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Políticas para system_config
CREATE POLICY "Permitir leitura pública de configurações" ON public.system_config
    FOR SELECT USING (true);

CREATE POLICY "Permitir modificação de configurações por admins" ON public.system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- TRIGGER: Criação automática de perfil ao cadastrar no Supabase auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (new.id, new.raw_user_meta_data->>'name', 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
