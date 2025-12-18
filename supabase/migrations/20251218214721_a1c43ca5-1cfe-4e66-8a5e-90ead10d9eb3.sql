-- Adicionar novas colunas para fluxo de confirmação
ALTER TABLE ordens_servico 
ADD COLUMN IF NOT EXISTS data_proposta_admin timestamp with time zone,
ADD COLUMN IF NOT EXISTS resposta_cliente text;

-- Dropar função existente para recriar com novos campos
DROP FUNCTION IF EXISTS public.listar_ordens_cliente(uuid);

-- Recriar RPC listar_ordens_cliente com novos campos
CREATE OR REPLACE FUNCTION public.listar_ordens_cliente(p_cliente_id uuid)
RETURNS TABLE(
  id uuid, 
  cliente_id uuid, 
  procedimento_id uuid, 
  clinica_id uuid, 
  dentista_id uuid, 
  data_solicitada timestamp with time zone, 
  data_confirmada timestamp with time zone, 
  data_proposta_admin timestamp with time zone,
  resposta_cliente text,
  status text, 
  observacoes_cliente text, 
  valor_pago numeric, 
  created_at timestamp with time zone, 
  procedimento_nome text, 
  clinica_nome text, 
  clinica_cidade text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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
    os.data_proposta_admin,
    os.resposta_cliente,
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

-- Criar RPC para cliente responder proposta
CREATE OR REPLACE FUNCTION public.responder_proposta_consulta(
  p_ordem_id uuid,
  p_resposta text,
  p_nova_data_sugerida timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_resposta NOT IN ('aprovado', 'rejeitado') THEN
    RAISE EXCEPTION 'Resposta inválida. Use "aprovado" ou "rejeitado"';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE id = p_ordem_id 
    AND status = 'aguardando_cliente'
  ) THEN
    RAISE EXCEPTION 'Ordem não encontrada ou não está aguardando resposta';
  END IF;

  IF p_resposta = 'aprovado' THEN
    UPDATE ordens_servico
    SET 
      resposta_cliente = 'aprovado',
      status = 'confirmada',
      data_confirmada = data_proposta_admin,
      updated_at = now()
    WHERE id = p_ordem_id;
  ELSE
    UPDATE ordens_servico
    SET 
      resposta_cliente = 'rejeitado',
      status = 'solicitada',
      data_solicitada = COALESCE(p_nova_data_sugerida, data_solicitada),
      data_proposta_admin = NULL,
      updated_at = now()
    WHERE id = p_ordem_id;
  END IF;

  RETURN p_ordem_id;
END;
$$;