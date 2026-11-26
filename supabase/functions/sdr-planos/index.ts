import { json, sdrHandler } from "../_shared/sdr-http.ts";
import { loadPlanos } from "../_shared/sdr-db.ts";

Deno.serve(sdrHandler(["GET", "POST"], async (_req, sb) => {
  const planos = (await loadPlanos(sb))
    .filter((p) => p.ativo && Number.isInteger(p.valor_cartao_centavos))
    .map((p) => ({
      codigo: p.codigo,
      nome: p.nome,
      valor_cartao_centavos: p.valor_cartao_centavos,
      valor_pix_centavos: p.valor_cartao_centavos! - (p.desconto_pix_centavos ?? 0),
      meses_validade: p.meses_validade,
    }));
  return json({
    ok: true,
    planos,
    observacao: "O cartão é parcelado e os juros ficam por conta do cliente, por isso o valor é maior. No Pix há desconto. Informe sempre os dois valores.",
  });
}));
