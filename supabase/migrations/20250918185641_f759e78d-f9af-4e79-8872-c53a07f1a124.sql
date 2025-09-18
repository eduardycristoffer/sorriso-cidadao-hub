-- Inserir usuário master eduardy
INSERT INTO usuarios (
  nome, 
  email, 
  cpf, 
  role, 
  assinatura_status,
  ativo,
  created_at,
  updated_at
) VALUES (
  'Eduardo',
  'eduardy@tryade.com',
  '00000000000',
  'admin',
  'ATIVA',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  ativo = true,
  updated_at = now();