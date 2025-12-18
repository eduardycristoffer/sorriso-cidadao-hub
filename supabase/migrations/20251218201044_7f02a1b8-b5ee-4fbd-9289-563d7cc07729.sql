-- Adicionar campo de validade na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS assinatura_validade timestamp with time zone;

-- Criar tabela de histórico de assinaturas
CREATE TABLE IF NOT EXISTS public.historico_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  valor numeric NOT NULL,
  data_pagamento timestamp with time zone DEFAULT now(),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  metodo_pagamento text,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico_assinaturas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Service role pode gerenciar historico" 
ON public.historico_assinaturas 
FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Usuarios podem ver seu historico" 
ON public.historico_assinaturas 
FOR SELECT 
USING (usuario_id IN (
  SELECT id FROM usuarios WHERE auth_user_id = auth.uid()
));