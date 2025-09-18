-- Primeiro vamos verificar a estrutura da tabela usuarios
-- E criar um usuário para o admin logado

-- Inserir usuário admin como cliente também para permitir testar solicitações
INSERT INTO usuarios (nome, email, telefone, auth_user_id, role, assinatura_status, ativo)
VALUES (
  'Admin Test User',
  'eduardy@tryade.com', 
  '+5562999999999',
  '1492c582-e6cf-436a-bdf0-32627c424d9d',
  'cliente',
  'ATIVA',
  true
);