import QRCode from "npm:qrcode@1.5.4";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  appendExternalCode, calcularPreco, faltandoDados, isUuid, maskRef, resolveCobranca, samePhone,
} from "../_shared/sdr-core.ts";
import { fail, json, optInt, readJson, sdrHandler } from "../_shared/sdr-http.ts";
import { getConfig, loadPlanos } from "../_shared/sdr-db.ts";

const COLS = "id,adesao_id,metodo,valor_centavos,desconto_centavos,status,gateway_ref,pix_copia_cola,link_pagamento,individual,expira_em,idempotency_key,created_at";
const TERMINAL_RUIM = ["recusada", "expirada", "cancelada"];

async function present(c: Record<string, any>, reused: boolean, links?: string[]) {
  let qr_png_base64: string | null = null;
  if (c.metodo === "pix" && c.status === "pendente" && c.pix_copia_cola) {
    const url: string = await QRCode.toDataURL(c.pix_copia_cola, { type: "image/png", margin: 1, width: 400 });
    qr_png_base64 = url.replace(/^data:image\/png;base64,/, "");
  }
  const { idempotency_key: _k, ...rest } = c;
  return json({
    ok: true, reutilizada: reused, cobranca: rest, qr_png_base64,
    ...(links ? { links_pagamento: links } : {}),
  });
}

async function findExisting(sb: SupabaseClient, key: string, adesaoId: string, metodo: string) {
  // Pix pendente vencido deixa de valer.
  await sb.from("cobrancas").update({ status: "expirada" })
    .eq("adesao_id", adesaoId).eq("metodo", metodo).eq("status", "pendente").lt("expira_em", new Date().toISOString());
  const [byKey, pending] = await Promise.all([
    sb.from("cobrancas").select(COLS).eq("idempotency_key", key).maybeSingle(),
    sb.from("cobrancas").select(COLS).eq("adesao_id", adesaoId).eq("metodo", metodo).eq("status", "pendente").maybeSingle(),
  ]);
  let k = byKey.data;
  if (k && TERMINAL_RUIM.includes(k.status)) {
    // tentativa anterior morreu: libera a chave para uma cobrança nova
    await sb.from("cobrancas").update({ idempotency_key: null }).eq("id", k.id);
    k = null;
  }
  return { byKey: k, pending: pending.data };
}

function linksDoCartao(c: Record<string, any>, links: string[]) {
  return links.map((u) => appendExternalCode(u, c.id));
}

Deno.serve(sdrHandler(["POST"], async (req, sb) => {
  const b = await readJson(req);
  if (!b) return fail(400, "json_invalido", "Corpo inválido");
  const { adesao_id, metodo, valor_confirmado_centavos, crm_conversation_id, idempotency_key, telefone } = b;
  if (!isUuid(adesao_id)) return fail(400, "campo_invalido", "adesao_id inválido");
  if (metodo !== "pix" && metodo !== "cartao") return fail(400, "campo_invalido", "metodo deve ser pix ou cartao");
  if (!Number.isInteger(valor_confirmado_centavos)) return fail(400, "campo_invalido", "valor_confirmado_centavos inteiro obrigatório");
  if (!optInt(crm_conversation_id)) return fail(400, "campo_invalido", "crm_conversation_id inválido");
  if (typeof idempotency_key !== "string" || idempotency_key.length < 8 || idempotency_key.length > 200) {
    return fail(400, "campo_invalido", "idempotency_key (8-200 caracteres) obrigatório");
  }

  const { data: adesao } = await sb.from("adesoes").select("*").eq("id", adesao_id).maybeSingle();
  if (!adesao) return fail(404, "adesao_nao_encontrada", "Adesão não encontrada");
  // A adesão só pode ser cobrada pela conversa/telefone dono dela (o N8N envia o telefone da conversa, não o modelo).
  if (!telefone || !samePhone(telefone, adesao.telefone)) return fail(403, "adesao_de_outro_telefone", "Adesão não pertence a esta conversa");

  let ex = await findExisting(sb, idempotency_key, adesao_id, metodo);
  let decision = resolveCobranca({ ...ex, adesaoStatus: adesao.status });
  if (decision.action === "ja_paga") return fail(409, "ja_paga", "Adesão já está paga");
  if (decision.action === "existing") {
    const c = decision.cobranca as Record<string, any>;
    if (c.metodo === "cartao" && c.status === "pendente") {
      const preco = calcularPreco(await loadPlanos(sb), "cartao", adesao.qtd_dependentes);
      return present(c, true, linksDoCartao(c, preco.links_cartao));
    }
    return present(c, true);
  }

  const faltando = faltandoDados(adesao);
  if (faltando.length) return fail(422, "dados_faltando", "Dados obrigatórios faltando", { faltando });

  let preco;
  try { preco = calcularPreco(await loadPlanos(sb), metodo, adesao.qtd_dependentes); }
  catch { return fail(503, "plano_indisponivel", "Plano indisponível"); }
  if (valor_confirmado_centavos !== preco.total_centavos) {
    return fail(409, "valor_divergente", "Valor confirmado diverge do valor do plano", { esperado: preco.total_centavos });
  }

  const ins = await sb.from("cobrancas").insert({
    adesao_id, metodo, valor_centavos: preco.total_centavos, desconto_centavos: preco.desconto_centavos,
    crm_conversation_id: crm_conversation_id ?? adesao.crm_conversation_id, idempotency_key,
    individual: metodo === "pix",
  }).select(COLS).single();
  if (ins.error?.code === "23505") {
    ex = await findExisting(sb, idempotency_key, adesao_id, metodo);
    decision = resolveCobranca({ ...ex, adesaoStatus: adesao.status });
    if (decision.action === "existing") return present(decision.cobranca as Record<string, any>, true);
    return fail(409, "conflito", "Cobrança concorrente, tente novamente");
  }
  if (ins.error) throw ins.error;
  const cob = ins.data;

  if (metodo === "cartao") {
    const links = linksDoCartao(cob, preco.links_cartao);
    const { data, error } = await sb.from("cobrancas").update({ link_pagamento: links[0], individual: false })
      .eq("id", cob.id).select(COLS).single();
    if (error) throw error;
    await sb.from("adesoes").update({ status: "aguardando_pagamento" }).eq("id", adesao_id);
    return present(data, false, links);
  }

  // Pix via Vega (produção)
  const apiKey = Deno.env.get("VEGA_CHECKOUT_API_KEY");
  const baseUrl = Deno.env.get("VEGA_BASE_URL") || "https://checkout.sorrisocidadao.com";
  const domain = Deno.env.get("VEGA_DOMAIN") || "checkout.sorrisocidadao.com";
  const webhookSecret = Deno.env.get("VEGA_WEBHOOK_SECRET");
  let tx: string | null = null, pix: string | null = null;
  try {
    if (!apiKey) throw new Error("vega_nao_configurado");
    const notification_url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/checkout-webhook` +
      (webhookSecret ? `?token=${encodeURIComponent(webhookSecret)}` : "");
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/api/checkout`, {
      method: "POST",
      headers: { "api-key": apiKey, "x-domain": domain, "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { name: adesao.nome, document: adesao.cpf, email: adesao.email, phone: adesao.telefone },
        products: preco.itens.map((i) => ({ code: i.codigo, name: i.nome, price: i.preco_centavos, is_digital: true, quantity: i.quantidade })),
        payment: {
          method: "pix", payment_value: preco.total_centavos, freight_value: 0,
          discount_value: preco.desconto_centavos, external_code: cob.id, currency: "BRL",
        },
        notification_url,
      }),
    });
    const text = await resp.text();
    if (!resp.ok) throw new Error(`vega_http_${resp.status}`);
    const d = JSON.parse(text)?.data ?? {};
    tx = d.transaction_token ?? null;
    pix = d.pix_copy_paste ?? null;
    if (!tx || !pix) throw new Error("vega_resposta_incompleta");
  } catch (e) {
    console.error("Falha Vega cobranca", cob.id, (e as Error).message);
    await sb.from("cobrancas").update({ status: "cancelada", idempotency_key: null }).eq("id", cob.id);
    return fail(502, "gateway_erro", "Não foi possível gerar o Pix agora");
  }

  const mins = Number(await getConfig(sb, "pix_validade_minutos"));
  const expira_em = Number.isFinite(mins) && mins > 0 ? new Date(Date.now() + mins * 60_000).toISOString() : null;
  const { data, error } = await sb.from("cobrancas").update({ gateway_ref: tx, pix_copia_cola: pix, expira_em })
    .eq("id", cob.id).select(COLS).single();
  if (error) throw error;
  await sb.from("adesoes").update({ status: "aguardando_pagamento" }).eq("id", adesao_id);
  console.log("Pix criado", cob.id, maskRef(tx));
  return present(data, false);
}));
