-- Corrigir problemas de segurança identificados pelo linter

-- 1. Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Adicionar políticas RLS para dentistas que estavam faltando
CREATE POLICY "Dentistas podem ver próprio perfil" ON public.dentistas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = dentistas.usuario_id 
      AND auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins podem gerenciar dentistas" ON public.dentistas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'operador')
    )
  );