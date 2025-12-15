-- Adicionar políticas para gerenciamento de categorias pelo service_role
CREATE POLICY "Service role pode gerenciar categorias"
ON public.categorias
FOR ALL
USING (auth.role() = 'service_role');

-- Adicionar políticas para gerenciamento de procedimentos pelo service_role
CREATE POLICY "Service role pode gerenciar procedimentos"
ON public.procedimentos
FOR ALL
USING (auth.role() = 'service_role');