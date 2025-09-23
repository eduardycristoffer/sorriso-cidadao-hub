-- Habilitar realtime para a tabela procedimentos
ALTER TABLE public.procedimentos REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.procedimentos;