-- Corrigir a função para evitar recursão e melhorar segurança
DROP FUNCTION IF EXISTS is_admin_user(uuid);

-- Criar função mais segura que não causa recursão
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM usuarios WHERE auth_user_id = auth.uid() AND ativo = true;
$$;

-- Remover política problemática
DROP POLICY IF EXISTS "Admins gerenciam usuarios" ON usuarios;

-- Criar nova política para admins sem recursão
CREATE POLICY "Admins gerenciam usuarios"
  ON usuarios
  FOR ALL
  USING (public.get_current_user_role() IN ('admin', 'operador'));

-- Política específica para permitir login sem auth (consulta pública limitada)
CREATE POLICY "Permitir consulta para login"
  ON usuarios
  FOR SELECT
  USING (
    role = 'cliente' 
    AND ativo = true 
    AND assinatura_status = 'ATIVA'
  );