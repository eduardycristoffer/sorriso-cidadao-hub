-- Primeiro, vamos remover as políticas problemáticas
DROP POLICY IF EXISTS "Admins e operadores podem ver todos usuários" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON usuarios;

-- Criar políticas RLS mais simples e seguras para usuarios
-- Política para usuários verem apenas seu próprio perfil
CREATE POLICY "Usuarios veem proprio perfil"
  ON usuarios
  FOR SELECT
  USING (auth.uid() = auth_user_id AND ativo = true);

-- Política para admins - usando uma abordagem diferente para evitar recursão
-- Primeiro, vamos criar uma função que verifica se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM usuarios 
    WHERE auth_user_id = user_id 
    AND role IN ('admin', 'operador') 
    AND ativo = true
  );
END;
$$;

-- Política para admins e operadores gerenciarem todos os usuários
CREATE POLICY "Admins gerenciam usuarios"
  ON usuarios
  FOR ALL
  USING (is_admin_user(auth.uid()));

-- Política para permitir inserção de novos clientes (via webhook)
CREATE POLICY "Permitir insercao de clientes"
  ON usuarios
  FOR INSERT
  WITH CHECK (role = 'cliente');