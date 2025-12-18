-- Criar tabela de configurações
CREATE TABLE public.configuracoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave text UNIQUE NOT NULL,
  valor text NOT NULL,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública
CREATE POLICY "Configuracoes são públicas para leitura"
ON public.configuracoes
FOR SELECT
USING (true);

-- Policy para service role gerenciar
CREATE POLICY "Service role pode gerenciar configuracoes"
ON public.configuracoes
FOR ALL
USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE TRIGGER update_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão de 12 meses
INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES ('meses_assinatura', '12', 'Quantidade de meses de validade da assinatura para novos cartões');

-- Atualizar usuários existentes com assinatura ATIVA que não têm validade definida
UPDATE public.usuarios 
SET assinatura_validade = created_at + INTERVAL '12 months'
WHERE assinatura_status = 'ATIVA' 
  AND assinatura_validade IS NULL;