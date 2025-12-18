-- Create payment_links table for Vega Checkout integration
CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor integer NOT NULL, -- em centavos
  transaction_token text,
  pix_code text,
  qr_code_url text,
  status text DEFAULT 'pending',
  cliente_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
  cliente_email text,
  cliente_nome text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_links
CREATE POLICY "Service role pode gerenciar payment_links"
ON public.payment_links
FOR ALL
USING (auth.role() = 'service_role');

-- Create dependentes table
CREATE TABLE public.dependentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cpf text,
  data_nascimento date,
  parentesco text,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dependentes ENABLE ROW LEVEL SECURITY;

-- RLS policies for dependentes
CREATE POLICY "Service role pode gerenciar dependentes"
ON public.dependentes
FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Usuarios podem ver seus dependentes"
ON public.dependentes
FOR SELECT
USING (usuario_id IN (
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid()
));

-- Triggers for updated_at
CREATE TRIGGER update_payment_links_updated_at
BEFORE UPDATE ON public.payment_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dependentes_updated_at
BEFORE UPDATE ON public.dependentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();