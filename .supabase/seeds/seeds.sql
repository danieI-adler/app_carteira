-- seeds.sql
-- Dados iniciais para ambiente de desenvolvimento e simulação da B3

-- 1. Inserir configurações do sistema
INSERT INTO public.system_config (key, value) VALUES
('market_status', 'open'),
('sell_commission', '0.00025')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Inserir ativos base negociáveis (Preços simulados baseados na cotação real aproximada)
INSERT INTO public.assets (symbol, name, type, last_price, updated_at) VALUES
('PETR4', 'Petróleo Brasileiro S.A. - Petrobras', 'acao', 42.09, now()),
('VALE3', 'Vale S.A.', 'acao', 62.10, now()),
('ITUB4', 'Itaú Unibanco Holding S.A.', 'acao', 32.80, now()),
('BBDC4', 'Banco Bradesco S.A.', 'acao', 13.90, now()),
('BOVA11', 'iShares Ibovespa Fundo de Índice', 'etf', 122.00, now()),
('IVVB11', 'iShares S&P 500 Fundo de Índice BDR', 'etf', 280.00, now()),
('MXRF11', 'Maxi Renda Fundo de Investimento Imobiliário', 'fii', 10.15, now()),
('HGLG11', 'CSHG Logística Fundo de Investimento Imobiliário', 'fii', 165.00, now()),
('ALZR11', 'Alianza Trust Renda Imobiliária FII', 'fii', 115.00, now())
ON CONFLICT (symbol) DO UPDATE SET 
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    last_price = EXCLUDED.last_price,
    updated_at = now();
