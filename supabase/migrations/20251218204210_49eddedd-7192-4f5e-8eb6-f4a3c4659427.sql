-- Adicionar campos para valor pago e procedimento manual
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS valor_pago numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nome_procedimento_manual text DEFAULT NULL;