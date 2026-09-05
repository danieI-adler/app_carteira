-- ==============================================================================
-- EXECUÇÃO DE ORDENS A MERCADO: EQUIPE LIBRA (MODELO XGBOOST STOCK PICKING)
-- ==============================================================================
-- Modelo: XGBoost treinado em histórico completo + Features atualizadas B3
-- Alocação ponderada pelas probabilidades (99% em ações, 1% caixa de segurança):
--   - BBDC4 (20,45%): 1.142.516 ações @ R$ 17,90 = R$ 20.451.036,40
--   - ITSA4 (19,97%): 1.431.328 ações @ R$ 13,95 = R$ 19.967.025,60
--   - RAIL3 (19,62%): 1.348.648 ações @ R$ 14,55 = R$ 19.622.828,40
--   - BRAP4 (19,62%):   872.901 ações @ R$ 22,48 = R$ 19.622.814,48
--   - CSNA3 (19,34%): 3.040.293 ações @ R$  6,36 = R$ 19.336.263,48
--   - Caixa ( 1,00%): R$ 1.000.031,64 (margem para oscilação de mercado)
-- ==============================================================================

DO $$
DECLARE
    v_team_id UUID;
    v_user_id UUID;

    -- Preços de mercado vigentes
    v_px_bbdc4 NUMERIC := 17.90;
    v_px_itsa4 NUMERIC := 13.95;
    v_px_rail3 NUMERIC := 14.55;
    v_px_brap4 NUMERIC := 22.48;
    v_px_csna3 NUMERIC :=  6.36;

    -- Quantidades dimensionadas pelo XGBoost
    v_qty_bbdc4 NUMERIC := 1142516;
    v_qty_itsa4 NUMERIC := 1431328;
    v_qty_rail3 NUMERIC := 1348648;
    v_qty_brap4 NUMERIC :=  872901;
    v_qty_csna3 NUMERIC := 3040293;
BEGIN
    -- 1. Obter Team ID da equipe libra
    SELECT id INTO v_team_id FROM public.teams WHERE LOWER(name) = 'libra';
    IF v_team_id IS NULL THEN
        RAISE EXCEPTION 'Equipe libra não encontrada na tabela teams!';
    END IF;

    -- 2. Obter User ID de admin/gestor responsável
    SELECT id INTO v_user_id FROM public.profiles WHERE team_id = v_team_id LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'fogoyfogy@gmail.com';
    END IF;

    -- 3. Garantir preços atualizados na tabela assets
    INSERT INTO public.assets (symbol, name, type, last_price, updated_at)
    VALUES 
        ('BBDC4', 'Banco Bradesco S.A. Pref', 'acao', v_px_bbdc4, now()),
        ('ITSA4', 'Itaúsa S.A. Pref', 'acao', v_px_itsa4, now()),
        ('RAIL3', 'Rumo S.A.', 'acao', v_px_rail3, now()),
        ('BRAP4', 'Bradespar S.A. Pref', 'acao', v_px_brap4, now()),
        ('CSNA3', 'Companhia Siderúrgica Nacional', 'acao', v_px_csna3, now())
    ON CONFLICT (symbol) DO UPDATE 
    SET 
        last_price = EXCLUDED.last_price,
        updated_at = now();

    -- 4. Submeter ordens a mercado para a equipe libra
    INSERT INTO public.orders (team_id, user_id, asset_symbol, quantity, order_type, side, status)
    VALUES
        (v_team_id, v_user_id, 'BBDC4', v_qty_bbdc4, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'ITSA4', v_qty_itsa4, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'RAIL3', v_qty_rail3, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'BRAP4', v_qty_brap4, 'market', 'buy', 'pending'),
        (v_team_id, v_user_id, 'CSNA3', v_qty_csna3, 'market', 'buy', 'pending');

    RAISE NOTICE 'Ordens a mercado do modelo XGBoost executadas com sucesso para a equipe libra!';
END $$;
