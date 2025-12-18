-- RPC para listar ordens de serviço do cliente (bypass RLS)
CREATE OR REPLACE FUNCTION public.listar_ordens_cliente(p_cliente_id UUID)
RETURNS TABLE (
  id UUID,
  cliente_id UUID,
  procedimento_id UUID,
  clinica_id UUID,
  dentista_id UUID,
  data_solicitada TIMESTAMPTZ,
  data_confirmada TIMESTAMPTZ,
  status TEXT,
  observacoes_cliente TEXT,
  valor_pago NUMERIC,
  created_at TIMESTAMPTZ,
  procedimento_nome TEXT,
  clinica_nome TEXT,
  clinica_cidade TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o cliente existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE usuarios.id = p_cliente_id 
    AND usuarios.ativo = true
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  RETURN QUERY
  SELECT 
    os.id,
    os.cliente_id,
    os.procedimento_id,
    os.clinica_id,
    os.dentista_id,
    os.data_solicitada,
    os.data_confirmada,
    os.status,
    os.observacoes_cliente,
    os.valor_pago,
    os.created_at,
    p.nome as procedimento_nome,
    c.nome as clinica_nome,
    c.cidade as clinica_cidade
  FROM ordens_servico os
  LEFT JOIN procedimentos p ON os.procedimento_id = p.id
  LEFT JOIN clinicas c ON os.clinica_id = c.id
  WHERE os.cliente_id = p_cliente_id
  ORDER BY os.created_at DESC;
END;
$$;