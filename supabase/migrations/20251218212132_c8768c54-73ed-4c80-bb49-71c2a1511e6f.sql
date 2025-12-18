-- Função RPC para buscar cliente por email (bypassa RLS)
CREATE OR REPLACE FUNCTION public.buscar_cliente_por_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  assinatura_status TEXT,
  assinatura_validade TIMESTAMPTZ,
  ativo BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nome, u.email, u.assinatura_status, u.assinatura_validade, u.ativo
  FROM usuarios u
  WHERE u.email = p_email
  AND u.ativo = true
  AND u.assinatura_status = 'ATIVA';
END;
$$;