import { isUuid, normalizePhone } from "../_shared/sdr-core.ts";
import { fail, json, readJson, sdrHandler } from "../_shared/sdr-http.ts";

Deno.serve(sdrHandler(["POST"], async (req, sb) => {
  const b = await readJson(req);
  if (!b) return fail(400, "json_invalido", "Corpo inválido");

  let q = sb.from("cobrancas")
    .select("id,adesao_id,metodo,valor_centavos,desconto_centavos,status,pix_copia_cola,link_pagamento,individual,expira_em,created_at,adesoes!inner(id,status,telefone)")
    .order("created_at", { ascending: false }).limit(1);
  if (b.adesao_id != null) {
    if (!isUuid(b.adesao_id)) return fail(400, "campo_invalido", "adesao_id inválido");
    q = q.eq("adesao_id", b.adesao_id);
  } else if (Number.isInteger(b.crm_conversation_id)) {
    q = q.eq("crm_conversation_id", b.crm_conversation_id);
  } else if (b.telefone != null) {
    const t = normalizePhone(b.telefone);
    if (!t) return fail(400, "telefone_invalido", "Telefone inválido");
    q = q.eq("adesoes.telefone", t);
  } else return fail(400, "campo_invalido", "Informe adesao_id, crm_conversation_id ou telefone");

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return json({ ok: true, encontrada: false, cobranca: null, adesao_paga: false });
  const { adesoes, ...c } = data as any;
  return json({
    ok: true, encontrada: true, adesao_paga: adesoes?.status === "paga",
    cobranca: { ...c, pix_copia_cola: c.status === "pendente" ? c.pix_copia_cola : null },
  });
}));
