-- ====================================================================
-- SCRIPT COMPLETO DE CONFIGURAÇÃO E ESTRUTURA DO BANCO DE DADOS
-- Cole este script inteiro de uma vez só no SQL Editor do Supabase!
-- ====================================================================

-- 1. LIMPEZA DOS PROCEDIMENTOS ANTIGOS (Para evitar conflitos)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_market_order_placed ON public.orders;
DROP TRIGGER IF EXISTS on_team_balance_update ON public.teams;
DROP TRIGGER IF EXISTS on_portfolio_position_change ON public.portfolio_positions;
DROP TRIGGER IF EXISTS on_asset_price_update ON public.assets;

-- 2. CRIAÇÃO DAS TABELAS E ESTRUTURAS BÁSICAS
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 10000000.00,
    net_worth NUMERIC(15, 2) NOT NULL DEFAULT 10000000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.assets (
    symbol TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('acao', 'fii', 'etf')),
    last_price NUMERIC(12, 2) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

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
    execution_price NUMERIC(12, 2),
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0100,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURANÇA RLS (Row Level Security)
-- Função auxiliar que checa se o usuário é admin de forma segura (evita recursão de RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Permitir leitura pública de perfis" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Permitir alteração do próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Permitir modificação total por admins" ON public.profiles FOR ALL USING (public.is_admin());

CREATE POLICY "Permitir leitura pública de equipes" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Permitir criação de equipes por admins" ON public.teams FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Permitir atualização por usuários logados" ON public.teams FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir leitura de posições para usuários da equipe" ON public.portfolio_positions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (profiles.team_id = portfolio_positions.team_id OR role = 'admin'))
);
CREATE POLICY "Permitir modificação por usuários autenticados" ON public.portfolio_positions FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir leitura pública de ativos" ON public.assets FOR SELECT USING (true);
CREATE POLICY "Permitir inserção por usuários logados" ON public.assets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Permitir atualização de ativos por usuários logados" ON public.assets FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir que usuários vejam ordens de sua equipe" ON public.orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (profiles.team_id = orders.team_id OR role = 'admin'))
);
CREATE POLICY "Permitir que usuários enviem ordens para sua equipe" ON public.orders FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profiles.team_id = orders.team_id)
);

CREATE POLICY "Permitir que equipes visualizem suas transações" ON public.transactions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (profiles.team_id = transactions.team_id OR role = 'admin'))
);

CREATE POLICY "Permitir que equipes vejam seus empréstimos" ON public.loans FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (profiles.team_id = loans.team_id OR role = 'admin'))
);

CREATE POLICY "Permitir leitura pública de configurações" ON public.system_config FOR SELECT USING (true);
CREATE POLICY "Permitir modificação de configurações por admins" ON public.system_config FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. TRIGGER: Criação e Associação de Novos Usuários (Admin Automático)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT := 'user';
    selected_team_id UUID := NULL;
BEGIN
    IF NEW.email = 'fogoyfogy@gmail.com' THEN
        user_role := 'admin';
    END IF;

    IF NEW.raw_user_meta_data->>'team_id' IS NOT NULL THEN
        selected_team_id := (NEW.raw_user_meta_data->>'team_id')::uuid;
    END IF;

    INSERT INTO public.profiles (id, name, role, team_id)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', user_role, selected_team_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. TRIGGER: Execução Automática e Atômica de Ordens a Mercado
CREATE OR REPLACE FUNCTION public.execute_market_order()
RETURNS TRIGGER AS $$
DECLARE
    v_last_price NUMERIC;
    v_team_balance NUMERIC;
    v_total_cost NUMERIC;
    v_pos_qty INT;
    v_pos_avg_price NUMERIC;
BEGIN
    IF NEW.order_type = 'market' THEN
        SELECT last_price INTO v_last_price
        FROM public.assets
        WHERE symbol = NEW.asset_symbol;

        IF v_last_price IS NULL THEN
            RAISE EXCEPTION 'Ativo % não possui preço cadastrado.', NEW.asset_symbol;
        END IF;

        SELECT balance INTO v_team_balance
        FROM public.teams
        WHERE id = NEW.team_id;

        v_total_cost := NEW.quantity * v_last_price;

        IF NEW.side = 'buy' THEN
            IF v_team_balance < v_total_cost THEN
                RAISE EXCEPTION 'Saldo insuficiente (Saldo: R$ %, Custo: R$ %).', v_team_balance, v_total_cost;
            END IF;

            UPDATE public.teams
            SET balance = balance - v_total_cost
            WHERE id = NEW.team_id;

            SELECT quantity, average_price INTO v_pos_qty, v_pos_avg_price
            FROM public.portfolio_positions
            WHERE team_id = NEW.team_id AND asset_symbol = NEW.asset_symbol AND position_type = 'long';

            IF FOUND THEN
                UPDATE public.portfolio_positions
                SET 
                    average_price = ((v_pos_qty * v_pos_avg_price) + v_total_cost) / (v_pos_qty + NEW.quantity),
                    quantity = quantity + NEW.quantity,
                    updated_at = now()
                WHERE team_id = NEW.team_id AND asset_symbol = NEW.asset_symbol AND position_type = 'long';
            ELSE
                INSERT INTO public.portfolio_positions (team_id, asset_symbol, quantity, average_price, position_type)
                VALUES (NEW.team_id, NEW.asset_symbol, NEW.quantity, v_last_price, 'long');
            END IF;

            INSERT INTO public.transactions (team_id, asset_symbol, quantity, price, transaction_type)
            VALUES (NEW.team_id, NEW.asset_symbol, NEW.quantity, v_last_price, 'buy');

            NEW.status := 'executed';
            NEW.execution_price := v_last_price;
            NEW.executed_at := now();

        ELSIF NEW.side = 'sell' THEN
            SELECT quantity INTO v_pos_qty
            FROM public.portfolio_positions
            WHERE team_id = NEW.team_id AND asset_symbol = NEW.asset_symbol AND position_type = 'long';

            IF v_pos_qty IS NULL OR v_pos_qty < NEW.quantity THEN
                RAISE EXCEPTION 'Posição insuficiente para venda (Possui: % unidades).', COALESCE(v_pos_qty, 0);
            END IF;

            UPDATE public.teams
            SET balance = balance + v_total_cost
            WHERE id = NEW.team_id;

            IF v_pos_qty = NEW.quantity THEN
                DELETE FROM public.portfolio_positions
                WHERE team_id = NEW.team_id AND asset_symbol = NEW.asset_symbol AND position_type = 'long';
            ELSE
                UPDATE public.portfolio_positions
                SET quantity = quantity - NEW.quantity, updated_at = now()
                WHERE team_id = NEW.team_id AND asset_symbol = NEW.asset_symbol AND position_type = 'long';
            END IF;

            INSERT INTO public.transactions (team_id, asset_symbol, quantity, price, transaction_type)
            VALUES (NEW.team_id, NEW.asset_symbol, NEW.quantity, v_last_price, 'sell');

            NEW.status := 'executed';
            NEW.execution_price := v_last_price;
            NEW.executed_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_market_order_placed
    BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.execute_market_order();

-- 6. TRIGGERS: Recálculo do Patrimônio Líquido das Equipes e Ranking
CREATE OR REPLACE FUNCTION public.recalculate_team_net_worth(p_team_id UUID)
RETURNS VOID AS $$
DECLARE
    v_cash NUMERIC;
    v_assets_value NUMERIC := 0;
BEGIN
    SELECT balance INTO v_cash
    FROM public.teams
    WHERE id = p_team_id;

    IF v_cash IS NULL THEN
        RETURN;
    END IF;

    SELECT COALESCE(SUM(
        CASE 
            WHEN p.position_type = 'long' THEN p.quantity * a.last_price
            WHEN p.position_type = 'short' THEN -p.quantity * a.last_price
            ELSE 0
        END
    ), 0) INTO v_assets_value
    FROM public.portfolio_positions p
    JOIN public.assets a ON a.symbol = p.asset_symbol
    WHERE p.team_id = p_team_id;

    UPDATE public.teams
    SET net_worth = v_cash + v_assets_value
    WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_net_worth_on_balance_update()
RETURNS TRIGGER AS $$
DECLARE
    v_assets_value NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN p.position_type = 'long' THEN p.quantity * a.last_price
            WHEN p.position_type = 'short' THEN -p.quantity * a.last_price
            ELSE 0
        END
    ), 0) INTO v_assets_value
    FROM public.portfolio_positions p
    JOIN public.assets a ON a.symbol = p.asset_symbol
    WHERE p.team_id = NEW.id;

    NEW.net_worth := NEW.balance + v_assets_value;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_team_balance_update
    BEFORE UPDATE OF balance ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_net_worth_on_balance_update();

CREATE OR REPLACE FUNCTION public.update_net_worth_on_position_change()
RETURNS TRIGGER AS $$
DECLARE
    v_team_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_team_id := OLD.team_id;
    ELSE
        v_team_id := NEW.team_id;
    END IF;

    PERFORM public.recalculate_team_net_worth(v_team_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_portfolio_position_change
    AFTER INSERT OR UPDATE OR DELETE ON public.portfolio_positions
    FOR EACH ROW EXECUTE FUNCTION public.update_net_worth_on_position_change();

CREATE OR REPLACE FUNCTION public.update_net_worth_on_asset_price_change()
RETURNS TRIGGER AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.teams LOOP
        PERFORM public.recalculate_team_net_worth(r.id);
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_asset_price_update
    AFTER UPDATE OF last_price ON public.assets
    FOR EACH STATEMENT EXECUTE FUNCTION public.update_net_worth_on_asset_price_change();

-- 7. CONFIGURAÇÕES INICIAIS DO SISTEMA
INSERT INTO public.system_config (key, value) VALUES
('market_status', 'open'),
('sell_commission', '0.00025')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 8. CARGA COMPLETA E ATUALIZADA DE ~160 ATIVOS DA B3 (Ações, FIIs e ETFs)
INSERT INTO public.assets (symbol, name, type, last_price, updated_at) VALUES
('AALR3', 'Alliança Saúde e Participações S.A.', 'acao', 22.50, now()),
('ABEV3', 'Ambev S.A.', 'acao', 12.50, now()),
('AERI3', 'Aeris Indústria e Comércio de Equipamentos S.A.', 'acao', 1.20, now()),
('ALOS3', 'Allos S.A.', 'acao', 22.10, now()),
('ALPA4', 'Alpargatas S.A.', 'acao', 9.20, now()),
('AMBP3', 'Ambipar Participações e Empreendimentos S.A.', 'acao', 18.40, now()),
('AMER3', 'Lojas Americanas S.A.', 'acao', 0.50, now()),
('ARZZ3', 'Arezzo Indústria e Comércio S.A.', 'acao', 58.40, now()),
('ASAI3', 'Sendas Distribuidora S.A. - Assaí', 'acao', 13.10, now()),
('AURE3', 'Auren Energia S.A.', 'acao', 13.20, now()),
('AZUL4', 'Azul S.A.', 'acao', 11.80, now()),
('B3SA3', 'B3 S.A. - Brasil, Bolsa, Balcão', 'acao', 12.20, now()),
('BBAS3', 'Banco do Brasil S.A.', 'acao', 27.50, now()),
('BBDC3', 'Banco Bradesco S.A. Ord', 'acao', 12.80, now()),
('BBDC4', 'Banco Bradesco S.A. Pref', 'acao', 14.50, now()),
('BBSE3', 'BB Seguridade Participações S.A.', 'acao', 33.10, now()),
('BEEF3', 'Minerva S.A.', 'acao', 7.40, now()),
('BHIA3', 'Casas Bahia Grupo S.A.', 'acao', 6.80, now()),
('BPAC11', 'Banco BTG Pactual S.A.', 'acao', 36.80, now()),
('BPAN4', 'Banco Pan S.A.', 'acao', 8.20, now()),
('BRAP4', 'Bradespar S.A.', 'acao', 20.30, now()),
('BRFS3', 'BRF S.A.', 'acao', 15.60, now()),
('BRKM5', 'Braskem S.A.', 'acao', 19.80, now()),
('BRSR6', 'Banco do Estado do Rio Grande do Sul S.A.', 'acao', 12.40, now()),
('CAML3', 'Camil Alimentos S.A.', 'acao', 9.10, now()),
('CBAV3', 'Companhia Brasileira de Alumínio', 'acao', 4.80, now()),
('CCRO3', 'CCR S.A.', 'acao', 13.40, now()),
('CEAB3', 'C&A Modas S.A.', 'acao', 7.50, now()),
('CMIG4', 'Companhia Energética de Minas Gerais Pref', 'acao', 11.20, now()),
('COGN3', 'Cogna Educação S.A.', 'acao', 2.30, now()),
('CPFE3', 'CPFL Energia S.A.', 'acao', 35.40, now()),
('CPLE6', 'Companhia Paranaense de Energia Pref', 'acao', 9.80, now()),
('CRFB3', 'Carrefour Brasil S.A.', 'acao', 10.90, now()),
('CSAN3', 'Cosan S.A.', 'acao', 15.20, now()),
('CSNA3', 'Companhia Siderúrgica Nacional', 'acao', 14.80, now()),
('CURY3', 'Cury Construtora e Incorporadora S.A.', 'acao', 18.20, now()),
('CYRE3', 'Cyrela Brazil Realty S.A.', 'acao', 21.50, now()),
('DIRR3', 'Direcional Engenharia S.A.', 'acao', 22.40, now()),
('DXCO3', 'Dexco S.A.', 'acao', 7.80, now()),
('ECOR3', 'EcoRodovias Infraestrutura e Logística S.A.', 'acao', 7.10, now()),
('EGIE3', 'Engie Brasil Energia S.A.', 'acao', 42.10, now()),
('ELET3', 'Centrais Elétricas Brasileiras S.A. Ord', 'acao', 38.50, now()),
('ELET6', 'Centrais Elétricas Brasileiras Pref', 'acao', 44.20, now()),
('EMBR3', 'Embraer S.A.', 'acao', 24.10, now()),
('ENEV3', 'Eneva S.A.', 'acao', 12.80, now()),
('ENGI11', 'Energisa S.A.', 'acao', 48.50, now()),
('EQTL3', 'Equatorial Energia S.A.', 'acao', 31.20, now()),
('EVEN3', 'Even Construtora e Incorporadora S.A.', 'acao', 6.40, now()),
('EZTC3', 'EZTEC Empreendimentos e Participações S.A.', 'acao', 15.80, now()),
('FESA4', 'Ferbasa S.A. Pref', 'acao', 38.20, now()),
('FLRY3', 'Fleury S.A.', 'acao', 16.20, now()),
('GGBR4', 'Gerdau S.A.', 'acao', 21.50, now()),
('GOAU4', 'Metalúrgica Gerdau S.A.', 'acao', 10.40, now()),
('GOLL4', 'Gol Linhas Aéreas Inteligentes S.A.', 'acao', 2.80, now()),
('GRND3', 'Grendene S.A.', 'acao', 6.90, now()),
('GUAR3', 'Guararapes Confecções S.A.', 'acao', 7.20, now()),
('HAPV3', 'Hapvida Participações e Investimentos S.A.', 'acao', 3.90, now()),
('HBSA3', 'Hidrovias do Brasil S.A.', 'acao', 3.40, now()),
('HYPE3', 'Hypera S.A.', 'acao', 34.50, now()),
('IGTI11', 'Iguatemi S.A.', 'acao', 22.80, now()),
('INTB3', 'Intelbras S.A.', 'acao', 22.10, now()),
('IRBR3', 'IRB - Brasil Resseguros S.A.', 'acao', 39.50, now()),
('ITSA4', 'Itaúsa S.A.', 'acao', 9.80, now()),
('ITUB4', 'Itaú Unibanco Holding S.A.', 'acao', 32.80, now()),
('JBSS32', 'JBS S.A.', 'acao', 32.10, now()),
('JHSF3', 'JHSF Participações S.A.', 'acao', 4.50, now()),
('KEPL3', 'Kepler Weber S.A.', 'acao', 10.80, now()),
('KLBN11', 'Klabin S.A.', 'acao', 21.90, now()),
('LREN3', 'Lojas Renner S.A.', 'acao', 16.50, now()),
('LWSA3', 'Locaweb Serviços de Internet S.A.', 'acao', 5.80, now()),
('MDIA3', 'M. Dias Branco S.A.', 'acao', 36.20, now()),
('MGLU3', 'Magazine Luiza S.A.', 'acao', 2.10, now()),
('MOVI3', 'Movida Participações S.A.', 'acao', 7.90, now()),
('MRFG3', 'Marfrig Global Foods S.A.', 'acao', 9.50, now()),
('MRVE3', 'MRV Engenharia e Participações S.A.', 'acao', 7.20, now()),
('MULT3', 'Multiplan Empreendimentos Imobiliários S.A.', 'acao', 24.80, now()),
('MYPK3', 'Iochpe Maxion S.A.', 'acao', 12.80, now()),
('NEOE3', 'Neoenergia S.A.', 'acao', 19.50, now()),
('NTCO3', 'Natura &Co Holding S.A.', 'acao', 15.90, now()),
('ODPV3', 'Odontoprev S.A.', 'acao', 11.80, now()),
('ONCO3', 'Instituto de Oncologia S.A.', 'acao', 6.80, now()),
('ORVR3', 'Orizon Valorização de Resíduos S.A.', 'acao', 38.50, now()),
('PCAR3', 'Companhia Brasileira de Distribuição - Pão de Açúcar', 'acao', 3.80, now()),
('PETR3', 'Petróleo Brasileiro S.A. Ord', 'acao', 40.50, now()),
('PETR4', 'Petróleo Brasileiro S.A. Pref', 'acao', 42.09, now()),
('PGMN3', 'Empreendimentos Pague Menos S.A.', 'acao', 2.90, now()),
('PLPL3', 'Plano & Plano Desenvolvimento Imobiliário S.A.', 'acao', 10.80, now()),
('POMO4', 'Marcopolo S.A. Pref', 'acao', 6.50, now()),
('PORT3', 'Wilson Sons S.A.', 'acao', 15.20, now()),
('POSI3', 'Positivo Tecnologia S.A.', 'acao', 8.20, now()),
('PRIO3', 'PetroRio S.A.', 'acao', 44.50, now()),
('PSSA3', 'Porto Seguro S.A.', 'acao', 28.50, now()),
('RADL3', 'Raia Drogasil S.A.', 'acao', 26.20, now()),
('RAIZ4', 'Raízen S.A.', 'acao', 3.60, now()),
('RAPT4', 'Randon S.A. Pref', 'acao', 11.80, now()),
('RECV3', 'PetroReconcavo S.A.', 'acao', 21.10, now()),
('RENT3', 'Localiza Rent a Car S.A.', 'acao', 58.40, now()),
('ROMI3', 'Indústrias Romi S.A.', 'acao', 11.40, now()),
('RRRP3', '3R Petroleum Óleo e Gás S.A.', 'acao', 27.50, now()),
('RUMO3', 'Rumo S.A.', 'acao', 22.40, now()),
('SANB11', 'Banco Santander (Brasil) S.A.', 'acao', 28.50, now()),
('SBSP3', 'Companhia de Saneamento Básico do Estado de SP', 'acao', 78.20, now()),
('SEQL3', 'Sequoia Logística e Transportes S.A.', 'acao', 0.80, now()),
('SIMH3', 'Simpar S.A.', 'acao', 7.40, now()),
('SLCE3', 'SLC Agrícola S.A.', 'acao', 19.10, now()),
('SMTO3', 'São Martinho S.A.', 'acao', 29.50, now()),
('STBP3', 'Santos Brasil Participações S.A.', 'acao', 13.80, now()),
('SUZB3', 'Suzano S.A.', 'acao', 56.40, now()),
('TAEE11', 'Transmissora Aliança de Energia Elétrica S.A.', 'acao', 35.80, now()),
('TASA4', 'Taurus Armas S.A. Pref', 'acao', 14.20, now()),
('TEND3', 'Construtora Tenda S.A.', 'acao', 10.40, now()),
('TIMS3', 'TIM S.A.', 'acao', 17.20, now()),
('TOTS3', 'Totvs S.A.', 'acao', 30.10, now()),
('TRPL4', 'CTEEP - Companhia de Transmissão de Energia Pref', 'acao', 25.10, now()),
('TTEN3', '3tentos Agroindustrial S.A.', 'acao', 11.20, now()),
('TXRX4', 'Teka-Tecelagem Kuehnrich S.A.', 'acao', 2.80, now()),
('UGPA3', 'Ultrapar Participações S.A.', 'acao', 26.40, now()),
('UNIP6', 'Unipar Carbocloro S.A.', 'acao', 72.50, now()),
('USIM5', 'Usinas Siderúrgicas de Minas Gerais Pref', 'acao', 8.20, now()),
('VALE3', 'Vale S.A.', 'acao', 62.10, now()),
('VIVA3', 'Vivara Participações S.A.', 'acao', 24.50, now()),
('VIVT3', 'Telefônica Brasil S.A.', 'acao', 51.50, now()),
('VLID3', 'Valid Soluções S.A.', 'acao', 16.20, now()),
('WEGE3', 'WEG S.A.', 'acao', 38.50, now()),
('YDUQ3', 'YDUQS Participações S.A.', 'acao', 16.80, now()),
('ZAMP3', 'Zamp S.A. (Burger King Brasil)', 'acao', 3.80, now()),
('MXRF11', 'Maxi Renda FII', 'fii', 10.15, now()),
('HGLG11', 'CSHG Logística FII', 'fii', 165.00, now()),
('ALZR11', 'Alianza Trust Renda Imobiliária FII', 'fii', 115.00, now()),
('HGRU11', 'CSHG Renda Urbana FII', 'fii', 125.00, now()),
('XPLG11', 'XP Log FII', 'fii', 108.50, now()),
('XPML11', 'XP Malls FII', 'fii', 112.40, now()),
('KNIP11', 'Kinea Índices de Preços FII', 'fii', 98.20, now()),
('KNCR11', 'Kinea Rendimentos Imobiliários FII', 'fii', 102.50, now()),
('HFOF11', 'Hedge Top FOFII FII', 'fii', 74.50, now()),
('VISC11', 'Vinci Shopping Centers FII', 'fii', 118.20, now()),
('BRCO11', 'Bresco Logística FII', 'fii', 122.50, now()),
('MALL11', 'Malls Brasil Plural FII', 'fii', 114.10, now()),
('BTLG11', 'BTG Pactual Logística FII', 'fii', 102.80, now()),
('PVBI11', 'VBI Prime Offices FII', 'fii', 98.40, now()),
('JSRE11', 'JS Real Estate Multigestão FII', 'fii', 72.10, now()),
('RECR11', 'FII Rec Recebíveis Imobiliários', 'fii', 82.50, now()),
('HGCR11', 'CSHG Recebíveis Imobiliários FII', 'fii', 104.20, now()),
('CPTS11', 'Capitânia Securities II FII', 'fii', 8.20, now()),
('TGAR11', 'TG Ativa Real FII', 'fii', 121.50, now()),
('IRDM11', 'Iridium Recebíveis Imobiliários FII', 'fii', 78.40, now()),
('KNSC11', 'Kinea Recebíveis Imobiliários FII', 'fii', 89.20, now()),
('VCJR11', 'Vectis Juros Real FII', 'fii', 92.50, now()),
('VRTA11', 'Fator Verità FII', 'fii', 88.40, now()),
('VGIR11', 'Valora REIII FII', 'fii', 9.60, now()),
('BTAL11', 'BTG Pactual Agro Logística FII', 'fii', 78.50, now()),
('VINO11', 'Vinci Oficinas FII', 'fii', 7.80, now()),
('BOVA11', 'iShares Ibovespa Fundo de Índice', 'etf', 122.00, now()),
('IVVB11', 'iShares S&P 500 Fundo de Índice BDR', 'etf', 280.00, now()),
('SMAL11', 'iShares BM&FBOVESPA Small Cap FII', 'etf', 105.40, now()),
('XINA11', 'Trend China MSCI Fundo de Índice', 'etf', 6.20, now()),
('HASH11', 'Hashdex Nasdaq Crypto Index ETF', 'etf', 48.50, now()),
('QBTC11', 'QR Bitcoin ETF', 'etf', 16.80, now()),
('QETH11', 'QR Ether ETF', 'etf', 8.50, now()),
('DIVO11', 'Itau Ibovespa Div/IDIV Fundo de Índice', 'etf', 84.10, now()),
('GOLD11', 'Trend Ouro Fundo de Índice', 'etf', 11.20, now()),
('SPXI11', 'Itau S&P 500 Fundo de Índice BDR', 'etf', 290.50, now())
ON CONFLICT (symbol) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    last_price = EXCLUDED.last_price,
    updated_at = now();

-- 9. RECALCULAR PATRIMÔNIO LÍQUIDO RETROATIVO DE TODAS AS EQUIPES
SELECT public.recalculate_team_net_worth(id) FROM public.teams;
