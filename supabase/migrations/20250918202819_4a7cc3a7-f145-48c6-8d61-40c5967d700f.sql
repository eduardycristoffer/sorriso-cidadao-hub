-- Atualizar o usuário admin existente para ter o auth_user_id correto
UPDATE usuarios 
SET auth_user_id = '1492c582-e6cf-436a-bdf0-32627c424d9d'
WHERE email = 'eduardy@tryade.com';