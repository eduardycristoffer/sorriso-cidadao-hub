-- Criar política temporária para permitir atualizações de procedimentos via painel admin
-- Esta política permite que usuários administradores atualizem procedimentos mesmo sem autenticação Supabase
CREATE POLICY "Permitir atualizacoes admin temporario" 
ON public.procedimentos 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

-- Esta política permite inserções também
CREATE POLICY "Permitir insercoes admin temporario" 
ON public.procedimentos 
FOR INSERT 
WITH CHECK (true);