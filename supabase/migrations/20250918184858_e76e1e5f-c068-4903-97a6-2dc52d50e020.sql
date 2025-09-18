-- Adicionar campos ativo nas tabelas existentes
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE clinicas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE dentistas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE procedimentos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- Atualizar políticas RLS para considerar o campo ativo
DROP POLICY IF EXISTS "Clínicas ativas públicas para leitura" ON clinicas;
CREATE POLICY "Clínicas ativas públicas para leitura" 
ON clinicas FOR SELECT 
USING (status = 'ATIVA' AND ativo = true);

DROP POLICY IF EXISTS "Procedimentos públicos para leitura" ON procedimentos;
CREATE POLICY "Procedimentos públicos para leitura" 
ON procedimentos FOR SELECT 
USING (ativo = true);

-- Política para bloquear usuários inativos (será verificada no frontend)
DROP POLICY IF EXISTS "Usuários podem ver próprio perfil" ON usuarios;
CREATE POLICY "Usuários podem ver próprio perfil" 
ON usuarios FOR SELECT 
USING (auth.uid() = auth_user_id AND ativo = true);