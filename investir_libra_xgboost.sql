-- ==============================================================================
-- EXECUÇÃO DE ORDENS A MERCADO: EQUIPE LIBRA (MODELO OFICIAL 100% EQUITY)
-- ==============================================================================

DO $$
DECLARE
    v_team_id UUID;
    v_user_id UUID;
BEGIN
    SELECT id INTO v_team_id FROM public.teams WHERE LOWER(name) = 'libra';
    IF v_team_id IS NULL THEN
        RAISE EXCEPTION 'Equipe libra nao encontrada!';
    END IF;

    SELECT id INTO v_user_id FROM public.profiles WHERE team_id = v_team_id LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'fogoyfogy@gmail.com';
    END IF;

    -- Atualizar preços na tabela assets
    INSERT INTO public.assets (symbol, name, type, last_price, updated_at)
    VALUES 
        ('BRAP4',  'Bradespar S.A. Pref', 'acao', 22.48, now()),
        ('ALUP11', 'Alupar Investimento S.A. Unit', 'acao', 33.64, now()),
        ('EQTL3',  'Equatorial Energia S.A.', 'acao', 39.16, now()),
        ('CMIG4',  'Companhia Energetica de Minas Gerais Pref', 'acao', 11.26, now()),
        ('SBSP3',  'Companhia de Saneamento Basico de SP - Sabesp', 'acao', 26.53, now())
    ON CONFLICT (symbol) DO UPDATE 
    SET last_price = EXCLUDED.last_price, updated_at = now();

    -- Inserir ordens a mercado
    INSERT INTO public.orders (team_id, user_id, asset_symbol, quantity, order_type, side, status)
    VALUES
        (v_team_id, v_user_id, 'BRAP4',  1587618, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'ALUP11', 1012154, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'EQTL3',   298429, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'CMIG4',   836351, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'SBSP3',   307487, 'market', 'buy', 'pending');

    RAISE NOTICE 'Ordens oficiais do Modelo Libra 100%% Equity enviadas com sucesso!';
END $$;
