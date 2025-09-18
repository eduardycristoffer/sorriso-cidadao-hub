-- Primeiro, vamos adicionar a categoria Clareamento se não existir
INSERT INTO categorias (nome, icone, ordem) 
VALUES ('Clareamento', 'sparkles', 5)
ON CONFLICT DO NOTHING;

-- Agora vamos ajustar os dados de procedimentos conforme especificado
-- Clareamento
INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Clareamento Caseiro', id, 600.00, NULL, true
FROM categorias WHERE nome = 'Clareamento'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Clareamento Consultório', id, 1300.00, NULL, true
FROM categorias WHERE nome = 'Clareamento'
ON CONFLICT DO NOTHING;

-- Atualizar Raspagem moderada para ter faixa de preço
UPDATE procedimentos 
SET preco_min = 250.00, preco_max = 300.00
WHERE nome = 'Raspagem moderada';

-- Adicionar procedimentos de prótese que estão faltando
INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Pino', id, 250.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'PPR com Grampo', id, 900.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Prótese flexível', id, 1300.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Prótese Total', id, 750.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Coroa artglass', id, 750.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'Coroa porcelana', id, 1100.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

INSERT INTO procedimentos (nome, categoria_id, preco_min, preco_max, ativo)
SELECT 'E-MAXX', id, 1250.00, NULL, true
FROM categorias WHERE nome = 'Prótese'
ON CONFLICT DO NOTHING;

-- Reordenar categorias para dar destaque à Prótese (ordem 1)
UPDATE categorias SET ordem = 1 WHERE nome = 'Prótese';
UPDATE categorias SET ordem = 2 WHERE nome = 'Dentística';
UPDATE categorias SET ordem = 3 WHERE nome = 'Endodontia';
UPDATE categorias SET ordem = 4 WHERE nome = 'Cirurgia';
UPDATE categorias SET ordem = 5 WHERE nome = 'Periodontia';
UPDATE categorias SET ordem = 6 WHERE nome = 'Clareamento';

-- Desativar outras clínicas, deixar apenas Clínica Sorriso Centro
UPDATE clinicas SET ativo = false WHERE nome != 'Clínica Sorriso Centro';