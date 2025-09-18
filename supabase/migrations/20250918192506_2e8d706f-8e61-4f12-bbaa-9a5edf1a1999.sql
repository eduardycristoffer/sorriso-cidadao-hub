-- Confirmar o email do usuário admin
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'eduardy@tryade.com';