-- Add periodo_preferido column to ordens_servico table
ALTER TABLE ordens_servico 
ADD COLUMN periodo_preferido TEXT CHECK (periodo_preferido IN ('MANHA', 'TARDE'));