-- Inserir histórico de pagamentos baseado nos webhooks aprovados existentes
INSERT INTO historico_assinaturas (usuario_id, valor, data_pagamento, data_inicio, data_fim, metodo_pagamento, observacoes)
SELECT 
  u.id as usuario_id,
  (w.payload->>'total_price')::numeric / 100 as valor,
  (w.payload->>'approved_at')::timestamp with time zone as data_pagamento,
  ((w.payload->>'approved_at')::timestamp with time zone)::date as data_inicio,
  ((w.payload->>'approved_at')::timestamp with time zone + INTERVAL '12 months')::date as data_fim,
  w.payload->>'method' as metodo_pagamento,
  'Migrado do webhook - Order: ' || w.order_id as observacoes
FROM webhook_events w
JOIN usuarios u ON LOWER(u.email) = LOWER(w.payload->'customer'->>'email')
WHERE w.event = 'checkout_approved'
  AND w.payload->>'approved_at' IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM historico_assinaturas h 
    WHERE h.usuario_id = u.id 
    AND h.observacoes LIKE '%' || w.order_id || '%'
  );