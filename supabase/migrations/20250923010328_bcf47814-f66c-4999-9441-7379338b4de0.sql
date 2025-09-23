-- Remover a política restritiva existente e recriar uma mais permissiva
DROP POLICY IF EXISTS "Admins podem modificar procedimentos" ON public.procedimentos;

-- Criar nova política mais permissiva para administração
CREATE POLICY "Admins podem modificar procedimentos" 
ON public.procedimentos 
FOR ALL 
USING (true) 
WITH CHECK (true);