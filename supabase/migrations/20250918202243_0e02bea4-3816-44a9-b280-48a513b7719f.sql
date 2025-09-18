-- Criar usuário cliente para o usuário admin logado para permitir testes
INSERT INTO usuarios (auth_user_id, nome, email, telefone, role, assinatura_status, ativo)
VALUES (
  '1492c582-e6cf-436a-bdf0-32627c424d9d',
  'Admin Test User',
  'eduardy@tryade.com', 
  '+5562999999999',
  'cliente',
  'ATIVA',
  true
)
ON CONFLICT (auth_user_id) DO UPDATE SET
  role = CASE 
    WHEN usuarios.role = 'admin' THEN 'admin'
    ELSE 'cliente'
  END,
  assinatura_status = 'ATIVA',
  ativo = true;