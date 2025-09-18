-- Criação das tabelas para o sistema Cartão Sorriso Cidadão

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuários (extende auth.users com dados adicionais)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT,
  role TEXT CHECK (role IN ('admin','operador','dentista','cliente')) DEFAULT 'cliente',
  assinatura_status TEXT CHECK (assinatura_status IN ('ATIVA','PENDENTE','CANCELADA')) DEFAULT 'PENDENTE',
  order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Clínicas parceiras
CREATE TABLE public.clinicas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  documento TEXT,
  responsavel TEXT,
  email TEXT,
  whatsapp TEXT,
  endereco TEXT,
  cidade TEXT,
  uf CHAR(2),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  horario_funcionamento TEXT,
  status TEXT CHECK (status IN ('ATIVA','INATIVA')) DEFAULT 'ATIVA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Dentistas
CREATE TABLE public.dentistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  clinica_id UUID REFERENCES public.clinicas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  cro TEXT,
  especialidades TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Categorias de procedimento
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Procedimentos
CREATE TABLE public.procedimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES public.categorias(id),
  nome TEXT NOT NULL,
  preco_min NUMERIC(10,2),
  preco_max NUMERIC(10,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Ordens de Serviço / Consultas
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
  clinica_id UUID REFERENCES public.clinicas(id),
  dentista_id UUID REFERENCES public.dentistas(id),
  procedimento_id UUID REFERENCES public.procedimentos(id),
  data_solicitada TIMESTAMP WITH TIME ZONE,
  data_confirmada TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('solicitada','em_analise','confirmada','realizada','cancelada')) DEFAULT 'solicitada',
  observacoes_cliente TEXT,
  observacoes_internas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Eventos do Webhook
CREATE TABLE public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT,
  event TEXT,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('ok','ignored','error')) DEFAULT 'ok',
  error_message TEXT
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dentistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios
CREATE POLICY "Usuários podem ver próprio perfil" ON public.usuarios
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins e operadores podem ver todos usuários" ON public.usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'operador')
    )
  );

-- Políticas RLS para categorias (público para leitura)
CREATE POLICY "Categorias públicas para leitura" ON public.categorias
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar categorias" ON public.categorias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Políticas RLS para procedimentos (público para leitura)
CREATE POLICY "Procedimentos públicos para leitura" ON public.procedimentos
  FOR SELECT USING (ativo = true);

CREATE POLICY "Admins podem modificar procedimentos" ON public.procedimentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'operador')
    )
  );

-- Políticas RLS para clínicas (público para leitura se ativa)
CREATE POLICY "Clínicas ativas públicas para leitura" ON public.clinicas
  FOR SELECT USING (status = 'ATIVA');

CREATE POLICY "Admins podem modificar clínicas" ON public.clinicas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'operador')
    )
  );

-- Políticas RLS para ordens_servico
CREATE POLICY "Clientes veem próprias OS" ON public.ordens_servico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = cliente_id 
      AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clientes podem criar próprias OS" ON public.ordens_servico
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = cliente_id 
      AND auth_user_id = auth.uid() 
      AND role = 'cliente'
    )
  );

CREATE POLICY "Admins e operadores podem gerenciar OS" ON public.ordens_servico
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'operador')
    )
  );

-- Políticas RLS para webhook_events (apenas admins)
CREATE POLICY "Apenas admins podem ver webhook events" ON public.webhook_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clinicas_updated_at BEFORE UPDATE ON public.clinicas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dentistas_updated_at BEFORE UPDATE ON public.dentistas
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procedimentos_updated_at BEFORE UPDATE ON public.procedimentos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais

-- Categorias
INSERT INTO public.categorias (nome, icone, ordem) VALUES
('Dentística', 'tooth', 1),
('Endodontia', 'drill', 2),
('Cirurgia', 'scissors', 3),
('Periodontia', 'brush', 4),
('Clareamento', 'sparkles', 5),
('Prótese', 'crown', 6),
('Avaliação', 'stethoscope', 7);

-- Procedimentos de Dentística
INSERT INTO public.procedimentos (categoria_id, nome, preco_min, preco_max) VALUES
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Classe I', 90.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Classe II', 110.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Classe III', 120.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Classe IV', 150.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Classe V', 90.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Reconstrução', 150.00, 200.00),
((SELECT id FROM public.categorias WHERE nome = 'Dentística'), 'Bloco direto', 250.00, 300.00);

-- Procedimentos de Endodontia
INSERT INTO public.procedimentos (categoria_id, nome, preco_min, preco_max) VALUES
((SELECT id FROM public.categorias WHERE nome = 'Endodontia'), 'Unirradicular', 450.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Endodontia'), 'Birradicular', 500.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Endodontia'), 'Trirradicular', 550.00, NULL);

-- Procedimentos de Cirurgia
INSERT INTO public.procedimentos (categoria_id, nome, preco_min, preco_max) VALUES
((SELECT id FROM public.categorias WHERE nome = 'Cirurgia'), 'Exo simples', 120.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Cirurgia'), 'Exo raiz', 150.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Cirurgia'), 'Exo 3º molar', 250.00, 350.00);

-- Procedimentos de Periodontia
INSERT INTO public.procedimentos (categoria_id, nome, preco_min, preco_max) VALUES
((SELECT id FROM public.categorias WHERE nome = 'Periodontia'), 'Profilaxia', 100.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Periodontia'), 'Raspagem', 150.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Periodontia'), 'Raspagem moderada', 250.00, 300.00),
((SELECT id FROM public.categorias WHERE nome = 'Periodontia'), 'Raspagem severa', 400.00, NULL);

-- Procedimentos de Clareamento
INSERT INTO public.procedimentos (categoria_id, nome, preco_min, preco_max) VALUES
((SELECT id FROM public.categorias WHERE nome = 'Clareamento'), 'Clareamento caseiro', 600.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Clareamento'), 'Clareamento consultório', 1300.00, NULL);

-- Procedimentos de Prótese
INSERT INTO public.procedimentos (categoria_id, nome, preco_min, preco_max) VALUES
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'Prótese Total', 750.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'PPR com Grampo', 900.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'Prótese flexível', 1300.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'Pino', 250.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'Coroa artglass', 750.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'Coroa porcelana', 1100.00, NULL),
((SELECT id FROM public.categorias WHERE nome = 'Prótese'), 'E-MAXX', 1250.00, NULL);

-- Criar usuário admin padrão
INSERT INTO public.usuarios (nome, email, role, assinatura_status) VALUES
('Administrador', 'admin@sorrisocidadao.com', 'admin', 'ATIVA');

-- Clínicas exemplo
INSERT INTO public.clinicas (nome, responsavel, cidade, uf, status) VALUES
('Clínica Sorriso Centro', 'Dr. João Silva', 'Anápolis', 'GO', 'ATIVA'),
('Odonto Vida', 'Dra. Maria Santos', 'Goiânia', 'GO', 'ATIVA'),
('Dental Care', 'Dr. Pedro Costa', 'Brasília', 'DF', 'ATIVA');