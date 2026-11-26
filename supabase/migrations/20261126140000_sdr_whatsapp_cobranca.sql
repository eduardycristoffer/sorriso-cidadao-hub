-- SDR WhatsApp: planos, adesoes, cobrancas, eventos_gateway (somente service_role)
CREATE TABLE public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE CHECK (codigo IN ('principal','dependente')),
  nome text NOT NULL,
  valor_cartao_centavos integer,
  desconto_pix_centavos integer,
  meses_validade integer NOT NULL DEFAULT 12,
  checkout_cartao_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.planos TO service_role;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.adesoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  crm_account_id integer,
  crm_contact_id integer,
  crm_conversation_id integer,
  telefone text NOT NULL,
  nome text,
  email text,
  cpf text,
  qtd_dependentes integer NOT NULL DEFAULT 0 CHECK (qtd_dependentes >= 0),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','aguardando_pagamento','paga','cancelada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.adesoes TO service_role;
ALTER TABLE public.adesoes ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX adesoes_uma_aberta_por_telefone ON public.adesoes (telefone) WHERE status IN ('rascunho','aguardando_pagamento');

CREATE TABLE public.cobrancas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adesao_id uuid NOT NULL REFERENCES public.adesoes(id) ON DELETE CASCADE,
  metodo text NOT NULL CHECK (metodo IN ('pix','cartao')),
  valor_centavos integer NOT NULL,
  desconto_centavos integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada','expirada','reembolsada','chargeback','cancelada')),
  gateway text NOT NULL DEFAULT 'vega',
  gateway_ref text,
  pix_copia_cola text,
  link_pagamento text,
  individual boolean NOT NULL DEFAULT true,
  crm_conversation_id integer,
  expira_em timestamptz,
  confirmacao_status text NOT NULL DEFAULT 'nao_enviada' CHECK (confirmacao_status IN ('nao_enviada','enviando','enviada')),
  confirmacao_enviada_em timestamptz,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.cobrancas TO service_role;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX cobrancas_uma_pendente ON public.cobrancas (adesao_id, metodo) WHERE status = 'pendente';
CREATE UNIQUE INDEX cobrancas_gateway_ref_uniq ON public.cobrancas (gateway_ref) WHERE gateway_ref IS NOT NULL;

CREATE TABLE public.eventos_gateway (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  gateway_ref text,
  external_code text,
  status text,
  payload jsonb,
  resultado text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.eventos_gateway TO service_role;
ALTER TABLE public.eventos_gateway ENABLE ROW LEVEL SECURITY;

-- Historico: um pagamento do gateway nunca gera duas linhas
ALTER TABLE public.historico_assinaturas ADD COLUMN IF NOT EXISTS gateway_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS historico_assinaturas_gateway_ref_uniq ON public.historico_assinaturas (gateway_ref) WHERE gateway_ref IS NOT NULL;

-- Agenda de visitas reaproveita ordens_servico
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS origem text;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS crm_conversation_id integer;
ALTER TABLE public.ordens_servico ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS ordens_servico_idempotency_uniq ON public.ordens_servico (idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TRIGGER planos_updated_at BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER adesoes_updated_at BEFORE UPDATE ON public.adesoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cobrancas_updated_at BEFORE UPDATE ON public.cobrancas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Valores informados pelo dono em 26/11/2026:
--  principal: cartao (parcelado, juros do cliente) R$ 59,42; Pix R$ 29,90 => desconto 2952
--  dependente: cartao R$ 29,88; valor Pix e forma de cobranca ainda nao definidos => inativo
INSERT INTO public.planos (codigo, nome, valor_cartao_centavos, desconto_pix_centavos, checkout_cartao_url, ativo) VALUES
  ('principal','Cartão Sorriso Cidadão',5942,2952,'https://checkout.l1mamultimarcas.com.br/VCCL1O8SCA33',true),
  ('dependente','Dependente adicional',2988,NULL,'https://checkout.l1mamultimarcas.com.br/VCCL1O8SCLCP',false)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.configuracoes (chave, valor, descricao)
SELECT 'pix_validade_minutos','','Validade do Pix em minutos (vazio = não informar expiração)'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes WHERE chave = 'pix_validade_minutos');
