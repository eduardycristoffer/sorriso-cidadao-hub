-- Criar função RPC para validar login do cliente (email + CPF)
-- Esta função usa security definer para bypassar RLS
CREATE OR REPLACE FUNCTION public.validar_cliente_login(
  p_email TEXT,
  p_cpf TEXT
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  assinatura_status TEXT,
  assinatura_validade TIMESTAMPTZ,
  auth_user_id UUID,
  ativo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nome,
    u.email,
    u.telefone,
    u.cpf,
    u.assinatura_status,
    u.assinatura_validade,
    u.auth_user_id,
    u.ativo
  FROM usuarios u
  WHERE u.email = p_email
    AND u.cpf = p_cpf
    AND u.ativo = true
    AND u.role = 'cliente'
  LIMIT 1;
END;
$$;