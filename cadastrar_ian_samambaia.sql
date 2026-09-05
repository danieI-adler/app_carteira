-- ==============================================================================
-- CADASTRO MANUAL: EQUIPE SAMAMBAIA E USUÁRIO IAN PESSONI VALENTE
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase para criar a equipe Samambaia
-- e vincular o usuário Ian Pessoni Valente.
-- ==============================================================================

DO $$
DECLARE
    v_team_id UUID;
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- 1. Criar ou obter a equipe Samambaia com R$ 100.000.000,00 de patrimônio
    INSERT INTO public.teams (name, balance, net_worth)
    VALUES ('samambaia', 100000000.00, 100000000.00)
    ON CONFLICT (name) DO UPDATE 
    SET balance = 100000000.00, net_worth = 100000000.00
    RETURNING id INTO v_team_id;

    -- 2. Gerar hash da senha '01234ian' com extensão pgcrypto
    v_encrypted_pw := crypt('01234ian', gen_salt('bf'));

    -- 3. Verificar se o usuário já existe em auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'ian.p.valente@gmail.com';

    IF v_user_id IS NULL THEN
        -- Criar usuário em auth.users
        v_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            'ian.p.valente@gmail.com',
            v_encrypted_pw,
            now(),
            '{"provider":"email","providers":["email"]}',
            jsonb_build_object('name', 'Ian Pessoni Valente', 'team_id', v_team_id),
            now(),
            now()
        );
    ELSE
        -- Atualizar senha e metadados se já existir
        UPDATE auth.users
        SET 
            encrypted_password = v_encrypted_pw,
            raw_user_meta_data = jsonb_build_object('name', 'Ian Pessoni Valente', 'team_id', v_team_id),
            email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_user_id;
    END IF;

    -- 4. Inserir ou atualizar na tabela public.profiles
    INSERT INTO public.profiles (id, name, role, team_id, created_at)
    VALUES (v_user_id, 'Ian Pessoni Valente', 'user', v_team_id, now())
    ON CONFLICT (id) DO UPDATE
    SET 
        name = 'Ian Pessoni Valente',
        team_id = v_team_id;

    RAISE NOTICE 'Equipe samambaia (ID: %) e usuário Ian Pessoni Valente cadastrados com sucesso!', v_team_id;
END $$;
