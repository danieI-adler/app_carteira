-- ==============================================================================
-- EXECUÇÃO DE ORDENS A MERCADO: EQUIPE SAMAMBAIA (IAN PESSONI VALENTE)
-- ==============================================================================
-- Alocação solicitada sobre o capital de R$ 100.000.000,00:
--   - 35% Micron Technology (BDR B3: MUTC34) = R$ 35.000.000,00
--   - 20% Petrobras (PETR4)                 = R$ 20.000.000,00
--   - 10% PRIO (PRIO3)                      = R$ 10.000.000,00
--   -  5% Áxia Energia (AXIA3)              = R$  5.000.000,00
--   - 15% BTG Pactual (BPAC11)              = R$ 15.000.000,00
--   - 15% Caixa mantido em saldo livre       = R$ 15.000.000,00
-- ==============================================================================

DO $$
DECLARE
    v_team_id UUID;
    v_user_id UUID;

    -- Preços de mercado vigentes
    v_px_mutc34 NUMERIC := 860.00;
    v_px_petr4  NUMERIC := 47.11;
    v_px_prio3  NUMERIC := 60.19;
    v_px_bpac11 NUMERIC := 59.24;
    v_px_axia3  NUMERIC := 55.28;

    -- Quantidades calculadas para cada ativo
    v_qty_mutc34 NUMERIC := FLOOR(35000000.00 / v_px_mutc34); -- 40.697 cotas (~R$ 34.999.420,00)
    v_qty_petr4  NUMERIC := FLOOR(20000000.00 / v_px_petr4);  -- 424.538 ações (~R$ 19.999.985,18)
    v_qty_prio3  NUMERIC := FLOOR(10000000.00 / v_px_prio3);  -- 166.140 ações (~R$ 9.999.966,60)
    v_qty_bpac11 NUMERIC := FLOOR(15000000.00 / v_px_bpac11); -- 253.207 units (~R$ 14.999.982,68)
    v_qty_axia3  NUMERIC := FLOOR(5000000.00  / v_px_axia3);  -- 90.448 ações (~R$ 4.999.965,44)
BEGIN
    -- 1. Obter Team ID e User ID
    SELECT id INTO v_team_id FROM public.teams WHERE name = 'samambaia';
    IF v_team_id IS NULL THEN
        RAISE EXCEPTION 'Equipe samambaia não encontrada! Execute primeiro o script cadastrar_ian_samambaia.sql.';
    END IF;

    SELECT id INTO v_user_id FROM auth.users WHERE email = 'ian.p.valente@gmail.com';

    -- 2. Garantir que os ativos existam e estejam com preços atualizados na tabela assets
    INSERT INTO public.assets (symbol, name, type, last_price, updated_at)
    VALUES 
        ('MUTC34', 'Micron Technology Inc. BDR', 'etf', v_px_mutc34, now()),
        ('PETR4', 'Petróleo Brasileiro S.A. Pref', 'acao', v_px_petr4, now()),
        ('PRIO3', 'PetroRio S.A.', 'acao', v_px_prio3, now()),
        ('BPAC11', 'Banco BTG Pactual S.A.', 'acao', v_px_bpac11, now()),
        ('AXIA3', 'Axia Energia S.A.', 'acao', v_px_axia3, now())
    ON CONFLICT (symbol) DO UPDATE 
    SET 
        last_price = EXCLUDED.last_price,
        updated_at = now();

    -- 3. Inserir ordens a mercado (o trigger on_order_insert executará a liquidação, saldo e custódia)
    INSERT INTO public.orders (team_id, user_id, asset_symbol, quantity, order_type, side, status)
    VALUES
        (v_team_id, v_user_id, 'MUTC34', v_qty_mutc34, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'PETR4',  v_qty_petr4,  'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'PRIO3',  v_qty_prio3,  'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'BPAC11', v_qty_bpac11, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'AXIA3',  v_qty_axia3,  'market', 'buy', 'pending');

    RAISE NOTICE 'Ordens a mercado enviadas e executadas com sucesso para a equipe samambaia!';
END $$;
