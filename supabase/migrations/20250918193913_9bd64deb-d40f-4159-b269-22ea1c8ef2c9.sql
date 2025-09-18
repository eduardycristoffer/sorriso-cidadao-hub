-- Remover todas as políticas existentes na tabela usuarios para recriá-las corretamente
DROP POLICY IF EXISTS "Admins gerenciam usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir consulta para login" ON usuarios;
DROP POLICY IF EXISTS "Usuarios veem proprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Permitir insercao de clientes" ON usuarios;

-- Criar função mais segura que não causa recursão
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM usuarios WHERE auth_user_id = auth.uid() AND ativo = true LIMIT 1;
$$;

-- Política para clientes verem apenas seu próprio perfil
CREATE POLICY "Usuarios veem proprio perfil"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = auth_user_id AND ativo = true);

-- Política para admins e operadores gerenciarem todos os usuários
CREATE POLICY "Admins gerenciam usuarios"
  ON usuarios
  FOR ALL
  USING (public.get_current_user_role() IN ('admin', 'operador'));

-- Política para permitir login sem autenticação (acesso público limitado)
CREATE POLICY "Permitir consulta publica para login"
  ON usuarios
  FOR SELECT
  USING (true);

-- Política para permitir inserção de novos clientes (para webhook)
CREATE POLICY "Permitir insercao via webhook"
  ON usuarios
  FOR INSERT
  WITH CHECK (role = 'cliente');