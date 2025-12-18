-- RPC para criar ordem de serviço (bypass RLS para clientes logados via CPF/Email)
CREATE OR REPLACE FUNCTION public.criar_ordem_servico(
  p_cliente_id UUID,
  p_procedimento_id UUID,
  p_clinica_id UUID,
  p_data_solicitada TIMESTAMPTZ,
  p_observacoes_cliente TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ordem_id UUID;
BEGIN
  -- Verificar se o cliente existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = p_cliente_id 
    AND ativo = true 
    AND assinatura_status = 'ATIVA'
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado ou inativo';
  END IF;

  -- Inserir a ordem de serviço
  INSERT INTO ordens_servico (
    cliente_id,
    procedimento_id,
    clinica_id,
    data_solicitada,
    observacoes_cliente,
    status
  ) VALUES (
    p_cliente_id,
    p_procedimento_id,
    p_clinica_id,
    p_data_solicitada,
    p_observacoes_cliente,
    'solicitada'
  )
  RETURNING id INTO v_ordem_id;

  RETURN v_ordem_id;
END;
$$;