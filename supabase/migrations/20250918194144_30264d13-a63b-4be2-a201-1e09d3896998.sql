-- Inserir o usuário manualmente baseado nos dados do webhook
INSERT INTO usuarios (
  nome, 
  email, 
  cpf, 
  telefone, 
  role, 
  assinatura_status, 
  order_id, 
  ativo
) VALUES (
  'Eduardy Cristoffer Lopes de souza conegundes',
  'eduardycristoffer@outlook.com',
  '07123645103',
  '+5562998324987',
  'cliente',
  'ATIVA',
  'VCP1O8UUH01',
  true
) ON CONFLICT (email) DO NOTHING;