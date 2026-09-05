-- ==============================================================================
-- CORREÇÃO IMEDIATA: AJUSTAR SALDO E PATRIMÔNIO DAS EQUIPES PARA R$ 100 MILHÕES
-- E ATUALIZAR VALORES DEFAULT DA TABELA TEAMS
-- ==============================================================================

-- 1. Alterar o valor padrão (DEFAULT) da tabela teams no banco de dados para R$ 100.000.000,00
ALTER TABLE public.teams 
    ALTER COLUMN balance SET DEFAULT 100000000.00,
    ALTER COLUMN net_worth SET DEFAULT 100000000.00;

-- 2. Atualizar todas as equipes que foram criadas com o valor antigo de R$ 10.000.000,00
-- Se a equipe não realizou compras (posições zeradas), o saldo e patrimônio vão direto para R$ 100.000.000,00
UPDATE public.teams
SET 
    balance = balance + 90000000.00,
    net_worth = net_worth + 90000000.00
WHERE balance <= 10000000.00 AND net_worth <= 10000000.00;

-- 3. Para equipes que não fizeram nenhuma operação ou têm exatamente 10 milhões:
UPDATE public.teams
SET 
    balance = 100000000.00,
    net_worth = 100000000.00
WHERE balance = 10000000.00 AND net_worth = 10000000.00;

-- 4. Verificação das equipes corrigidas
SELECT id, name, balance, net_worth FROM public.teams ORDER BY created_at DESC;
