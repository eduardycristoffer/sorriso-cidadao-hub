-- Confirmar o email do usuário admin (sem a coluna confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'eduardy@tryade.com';