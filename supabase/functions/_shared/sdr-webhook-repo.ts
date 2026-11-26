// Implementação Supabase do WebhookRepo + aviso ao N8N. Fica fora do sdr-webhook.ts para ele ser testável sem banco.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isUuid, onlyDigits, normalizePhone, samePhone, type CobrancaStatus } from "./sdr-core.ts";
import type { CobrancaCtx, Notify, WebhookRepo } from "./sdr-webhook.ts";

const COB = "id,adesao_id,metodo,valor_centavos,status,gateway_ref,crm_conversation_id";
const ADD_MONTHS = (d: Date, m: number) => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };

export function supabaseWebhookRepo(sb: SupabaseClient): WebhookRepo {
  return {
    async registrarEvento(e) {
      const { error } = await sb.from("eventos_gateway").insert({
        event_key: e.key, gateway_ref: e.gatewayRef, external_code: e.externalCode, status: e.status, payload: e.payload,
      });
      if (!error) return { novo: true, resultado: null };
      if (error.code !== "23505") throw error;
      const { data } = await sb.from("eventos_gateway").select("resultado").eq("event_key", e.key).maybeSingle();
      return { novo: false, resultado: data?.resultado ?? null };
    },

    async marcarEvento(key, resultado) {
      await sb.from("eventos_gateway").update({ resultado }).eq("event_key", key);
    },

    async acharCobranca({ externalCode, gatewayRef, customer }) {
      if (externalCode && isUuid(externalCode)) {
        const { data } = await sb.from("cobrancas").select(COB).eq("id", externalCode).maybeSingle();
        if (data) return data as CobrancaCtx;
      }
      if (gatewayRef) {
        const { data } = await sb.from("cobrancas").select(COB).eq("gateway_ref", gatewayRef).maybeSingle();
        if (data) return data as CobrancaCtx;
      }
      // Link de cartão estático pode não devolver external_code: casa por CPF/telefone da adesão em aberto.
      if (customer) {
        const cpf = onlyDigits(customer.cpf ?? customer.document);
        const fone = normalizePhone(customer.phone);
        let adesaoIds: string[] = [];
        if (cpf.length === 11) {
          const { data } = await sb.from("adesoes").select("id").eq("cpf", cpf).eq("status", "aguardando_pagamento");
          adesaoIds = (data ?? []).map((a) => a.id);
        }
        if (!adesaoIds.length && fone) {
          const { data } = await sb.from("adesoes").select("id,telefone").eq("telefone", fone).eq("status", "aguardando_pagamento");
          adesaoIds = (data ?? []).filter((a) => samePhone(a.telefone, fone)).map((a) => a.id);
        }
        if (adesaoIds.length === 1) {
          const { data } = await sb.from("cobrancas").select(COB).eq("adesao_id", adesaoIds[0]).eq("metodo", "cartao")
            .in("status", ["pendente", "aprovada"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
          if (data) return data as CobrancaCtx;
        }
      }
      return null;
    },

    async atualizarCobranca(id, patch) {
      const { error } = await sb.from("cobrancas").update(patch).eq("id", id);
      if (error) throw error;
    },

    async ativarAssinatura(ctx, referencia) {
      const { data: ad, error: eA } = await sb.from("adesoes").select("*").eq("id", ctx.adesao_id).single();
      if (eA) throw eA;
      const { data: cfg } = await sb.from("planos").select("meses_validade").eq("codigo", "principal").maybeSingle();
      const meses = cfg?.meses_validade ?? 12;
      const agora = new Date();
      const validade = ADD_MONTHS(agora, meses);

      let usuarioId: string | null = ad.usuario_id;
      if (!usuarioId && ad.cpf) {
        const { data } = await sb.from("usuarios").select("id").eq("cpf", ad.cpf).maybeSingle();
        usuarioId = data?.id ?? null;
      }
      if (!usuarioId && ad.email) {
        const { data } = await sb.from("usuarios").select("id").eq("email", ad.email).maybeSingle();
        usuarioId = data?.id ?? null;
      }
      const campos = {
        nome: ad.nome, cpf: ad.cpf, telefone: ad.telefone,
        assinatura_status: "ATIVA", assinatura_validade: validade.toISOString(), order_id: referencia, ativo: true,
      };
      if (usuarioId) {
        const { error } = await sb.from("usuarios").update({ ...campos, email: ad.email }).eq("id", usuarioId);
        if (error) throw error;
      } else {
        const { data, error } = await sb.from("usuarios").insert({ ...campos, email: ad.email, role: "cliente" }).select("id").single();
        if (error) throw error;
        usuarioId = data.id;
      }

      const { data: cob } = await sb.from("cobrancas").select("valor_centavos,metodo").eq("id", ctx.id).single();
      const { error: eH } = await sb.from("historico_assinaturas").insert({
        usuario_id: usuarioId, valor: (cob?.valor_centavos ?? ctx.valor_centavos) / 100,
        data_pagamento: agora.toISOString(), data_inicio: agora.toISOString().slice(0, 10),
        data_fim: validade.toISOString().slice(0, 10), metodo_pagamento: cob?.metodo ?? ctx.metodo,
        observacoes: `Pagamento via SDR WhatsApp - cobranca ${ctx.id}`, gateway_ref: referencia,
      });
      if (eH && eH.code !== "23505") throw eH; // 23505 = pagamento já registrado: segue sem duplicar

      const { error: eU } = await sb.from("adesoes").update({ status: "paga", usuario_id: usuarioId }).eq("id", ctx.adesao_id);
      if (eU) throw eU;
    },

    async reivindicarConfirmacao(id) {
      const stale = new Date(Date.now() - 5 * 60_000).toISOString();
      const { data, error } = await sb.from("cobrancas")
        .update({ confirmacao_status: "enviando" })
        .eq("id", id)
        .or(`confirmacao_status.eq.nao_enviada,and(confirmacao_status.eq.enviando,updated_at.lt.${stale})`)
        .select("id");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },

    async finalizarConfirmacao(id, enviada) {
      const { error } = await sb.from("cobrancas").update(
        enviada
          ? { confirmacao_status: "enviada", confirmacao_enviada_em: new Date().toISOString() }
          : { confirmacao_status: "nao_enviada" },
      ).eq("id", id);
      if (error) throw error;
    },
  };
}

/** Avisa o N8N (que fala com o cliente e atualiza o CRM). false = N8N não configurado; lança em falha de entrega. */
export function n8nNotify(sb: SupabaseClient): Notify {
  return async (evento: string, ctx: CobrancaCtx, status: CobrancaStatus) => {
    const url = Deno.env.get("N8N_PAYMENT_WEBHOOK_URL");
    const key = Deno.env.get("N8N_SHARED_KEY");
    if (!url || !key) { console.warn("N8N_PAYMENT_WEBHOOK_URL/N8N_SHARED_KEY ausentes: aviso ao cliente não enviado"); return false; }
    const { data: ad } = await sb.from("adesoes")
      .select("id,nome,telefone,crm_account_id,crm_contact_id,crm_conversation_id").eq("id", ctx.adesao_id).single();
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-n8n-key": key },
      body: JSON.stringify({
        evento, status, cobranca_id: ctx.id, adesao_id: ctx.adesao_id, metodo: ctx.metodo,
        valor_centavos: ctx.valor_centavos,
        crm_account_id: ad?.crm_account_id ?? null, crm_contact_id: ad?.crm_contact_id ?? null,
        crm_conversation_id: ctx.crm_conversation_id ?? ad?.crm_conversation_id ?? null,
        telefone: ad?.telefone ?? null, nome: ad?.nome ?? null,
      }),
    });
    if (!resp.ok) throw new Error(`n8n_http_${resp.status}`);
    return true;
  };
}
