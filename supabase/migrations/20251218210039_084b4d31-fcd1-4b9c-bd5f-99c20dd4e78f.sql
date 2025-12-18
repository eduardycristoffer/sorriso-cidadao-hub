-- Permitir procedimento_id ser NULL quando usar nome manual
ALTER TABLE ordens_servico ALTER COLUMN procedimento_id DROP NOT NULL;