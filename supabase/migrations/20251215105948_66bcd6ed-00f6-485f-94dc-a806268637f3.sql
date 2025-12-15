-- Tabela de categorias de procedimentos
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  icone TEXT,
  ordem INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de clínicas parceiras
CREATE TABLE public.clinicas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT NOT NULL,
  estado TEXT DEFAULT 'GO',
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de dentistas
CREATE TABLE public.dentistas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cro TEXT,
  especialidade TEXT,
  clinica_id UUID REFERENCES public.clinicas(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de procedimentos
CREATE TABLE public.procedimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias(id),
  preco_min NUMERIC(10,2) NOT NULL,
  preco_max NUMERIC(10,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de usuários (clientes e admins)
CREATE TABLE public.usuarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT,
  telefone TEXT,
  role TEXT DEFAULT 'cliente' CHECK (role IN ('cliente', 'admin')),
  assinatura_status TEXT DEFAULT 'PENDENTE' CHECK (assinatura_status IN ('ATIVA', 'PENDENTE', 'CANCELADA', 'VENCIDA')),
  order_id TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.usuarios(id) NOT NULL,
  procedimento_id UUID REFERENCES public.procedimentos(id) NOT NULL,
  clinica_id UUID REFERENCES public.clinicas(id),
  dentista_id UUID REFERENCES public.dentistas(id),
  data_solicitada TIMESTAMP WITH TIME ZONE NOT NULL,
  data_confirmada TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'em_analise', 'confirmada', 'realizada', 'cancelada')),
  observacoes_cliente TEXT,
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de eventos de webhook
CREATE TABLE public.webhook_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT,
  event TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'ok',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias (leitura pública)
CREATE POLICY "Categorias são públicas para leitura" ON public.categorias
  FOR SELECT USING (true);

-- Políticas para clínicas (leitura pública para clínicas ativas)
CREATE POLICY "Clínicas ativas são públicas para leitura" ON public.clinicas
  FOR SELECT USING (ativo = true);

-- Políticas para dentistas (leitura pública)
CREATE POLICY "Dentistas são públicos para leitura" ON public.dentistas
  FOR SELECT USING (true);

-- Políticas para procedimentos (leitura pública para ativos)
CREATE POLICY "Procedimentos ativos são públicos para leitura" ON public.procedimentos
  FOR SELECT USING (ativo = true);

-- Políticas para usuários
CREATE POLICY "Usuários podem ver seus próprios dados" ON public.usuarios
  FOR SELECT USING (auth.uid() = auth_user_id OR email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role pode gerenciar usuários" ON public.usuarios
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas para ordens de serviço
CREATE POLICY "Clientes podem ver suas próprias ordens" ON public.ordens_servico
  FOR SELECT USING (
    cliente_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Clientes podem criar ordens" ON public.ordens_servico
  FOR INSERT WITH CHECK (
    cliente_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Clientes podem atualizar suas ordens" ON public.ordens_servico
  FOR UPDATE USING (
    cliente_id IN (SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role pode gerenciar ordens" ON public.ordens_servico
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas para webhook_events (apenas service_role)
CREATE POLICY "Service role pode gerenciar webhooks" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinicas_updated_at BEFORE UPDATE ON public.clinicas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dentistas_updated_at BEFORE UPDATE ON public.dentistas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedimentos_updated_at BEFORE UPDATE ON public.procedimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_usuarios_email ON public.usuarios(email);
CREATE INDEX idx_usuarios_auth_user_id ON public.usuarios(auth_user_id);
CREATE INDEX idx_ordens_servico_cliente_id ON public.ordens_servico(cliente_id);
CREATE INDEX idx_ordens_servico_status ON public.ordens_servico(status);
CREATE INDEX idx_procedimentos_categoria_id ON public.procedimentos(categoria_id);