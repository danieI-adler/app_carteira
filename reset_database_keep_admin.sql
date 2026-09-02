-- ==============================================================================
-- SCRIPT DE RESET GERAL DO BANCO (MANTÉM APENAS O ADMINISTRADOR)
-- ==============================================================================
-- Este script:
-- 1. Limpa todas as posições em custódia (portfolio_positions)
-- 2. Limpa todo o histórico de transações (transactions)
-- 3. Limpa todas as ordens de compra/venda (orders)
-- 4. Exclui todos os usuários normais, mantendo apenas os administradores (role = 'admin')
-- 5. Exclui todas as equipes antigas e redefine a equipe do admin com R$ 100.000.000,00
-- ==============================================================================

BEGIN;

-- 1. Limpar todas as posições em custódia de todas as equipes
DELETE FROM public.portfolio_positions;

-- 2. Limpar todas as ordens registradas
DELETE FROM public.orders;

-- 3. Limpar todo o histórico de transações
DELETE FROM public.transactions;

-- 4. Desvincular equipes temporariamente dos perfis para permitir a exclusão
UPDATE public.profiles
SET team_id = NULL
WHERE role != 'admin';

-- 5. Excluir contas de usuários que NÃO são administradores
-- (Isso apaga o perfil público e a conta de login no Supabase Auth)
DELETE FROM auth.users
WHERE id IN (
    SELECT id FROM public.profiles WHERE role != 'admin'
);

-- 6. Excluir registros restantes de perfis não-administradores
DELETE FROM public.profiles
WHERE role != 'admin';

-- 7. Limpar equipes que não estejam associadas ao admin
DELETE FROM public.teams
WHERE id NOT IN (
    SELECT team_id FROM public.profiles WHERE role = 'admin' AND team_id IS NOT NULL
);

-- 8. Resetar o saldo e patrimônio da equipe do Administrador para R$ 100.000.000,00
UPDATE public.teams
SET 
    balance = 100000000.00,
    net_worth = 100000000.00;

COMMIT;

-- Verificação final do que restou no banco:
SELECT id, name, role, email FROM public.profiles;
SELECT id, name, balance, net_worth FROM public.teams;
