-- Primeiro, vamos verificar se existe um usuário no auth.users com esse email
DO $$
DECLARE
    auth_user_exists boolean;
    auth_uid uuid;
BEGIN
    -- Verificar se já existe um usuário auth com esse email
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'eduardycristoffer@outlook.com') INTO auth_user_exists;
    
    IF NOT auth_user_exists THEN
        -- Se não existe, criar o usuário na tabela auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'eduardycristoffer@outlook.com',
            '$2a$10$hash_placeholder', -- placeholder hash
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) RETURNING id INTO auth_uid;
    ELSE
        -- Se já existe, pegar o ID
        SELECT id INTO auth_uid FROM auth.users WHERE email = 'eduardycristoffer@outlook.com';
    END IF;
    
    -- Atualizar o usuário na tabela usuarios com o auth_user_id
    UPDATE usuarios 
    SET auth_user_id = auth_uid 
    WHERE email = 'eduardycristoffer@outlook.com' AND auth_user_id IS NULL;
    
END $$;