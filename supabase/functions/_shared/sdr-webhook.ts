// Orquestração do webhook do gateway para cobranças criadas pelo SDR. Sem I/O direto:
// o acesso ao banco e o aviso ao N8N entram por interfaces (testável com repositório em memória).
import {
  type CobrancaStatus, mapVegaStatus, NOTIFY_EVENT, transicaoPermitida, valorSuficiente,
} from "./sdr-core.ts";

export interface CobrancaCtx {
  id: string;
  adesao_id: string;
  metodo: "pix" | "cartao";
  valor_centavos: number;
  status: string;
  gateway_ref: string | null;
  crm_conversation_id: number | null;
}

export interface EventoNormalizado {
  key: string;
  gatewayRef: string | null;
  rawStatus: string;
  externalCode: string | null;
  customer: Record<string, any> | null;
  amount: number | null;
  payload: unknown;
}

export interface WebhookRepo {
  registrarEvento(e: { key: string; gatewayRef: string | null; externalCode: string | null; status: string; payload: unknown }): Promise<{ novo: boolean; resultado: string | null }>;
  marcarEvento(key: string, resultado: string): Promise<void>;
  acharCobranca(m: { externalCode: string | null; gatewayRef: string | null; customer: Record<string, any> | null }): Promise<CobrancaCtx | null>;
  atualizarCobranca(id: string, patch: { status?: string; gateway_ref?: string }): Promise<void>;
  ativarAssinatura(ctx: CobrancaCtx, referencia: string): Promise<void>;
  reivindicarConfirmacao(id: string): Promise<boolean>;
  finalizarConfirmacao(id: string, enviada: boolean): Promise<void>;
}

/** Retorna true se o aviso foi entregue, false se o N8N não está configurado. Lança em falha de entrega. */
export type Notify = (evento: string, ctx: CobrancaCtx, status: CobrancaStatus) => Promise<boolean>;

export type ResultadoWebhook =
  | { status: "duplicado" }
  | { status: "nao_sdr" }
  | { status: "sem_transicao" }
  | { status: "ignorado"; motivo: string }
  | { status: "valor_divergente" }
  | { status: "processado"; novoStatus: CobrancaStatus; confirmacaoEnviada: boolean };

export async function processarEventoSdr(repo: WebhookRepo, notify: Notify, ev: EventoNormalizado): Promise<ResultadoWebhook> {
  const reg = await repo.registrarEvento({
    key: ev.key, gatewayRef: ev.gatewayRef, externalCode: ev.externalCode, status: ev.rawStatus, payload: ev.payload,
  });
  if (!reg.novo && reg.resultado === "ok") return { status: "duplicado" };

  const ctx = await repo.acharCobranca({ externalCode: ev.externalCode, gatewayRef: ev.gatewayRef, customer: ev.customer });
  if (!ctx) return { status: "nao_sdr" }; // quem chamou decide (fluxo legado do site); o evento fica sem resultado

  const novo = mapVegaStatus(ev.rawStatus);
  if (!novo) { await repo.marcarEvento(ev.key, "sem_transicao"); return { status: "sem_transicao" }; }

  if (!transicaoPermitida(ctx.status, novo)) {
    await repo.marcarEvento(ev.key, "ignorado_regressao");
    return { status: "ignorado", motivo: `${ctx.status}->${novo}` };
  }

  if (novo === "aprovada" && !valorSuficiente(ev.amount, ctx.valor_centavos)) {
    await notify("pagamento_divergente", ctx, novo);
    await repo.marcarEvento(ev.key, "valor_divergente");
    return { status: "valor_divergente" };
  }

  await repo.atualizarCobranca(ctx.id, { status: novo, ...(ev.gatewayRef && !ctx.gateway_ref ? { gateway_ref: ev.gatewayRef } : {}) });

  let confirmacaoEnviada = false;
  if (novo === "aprovada") {
    await repo.ativarAssinatura(ctx, ev.gatewayRef ?? `cob:${ctx.id}`);
    if (await repo.reivindicarConfirmacao(ctx.id)) {
      try {
        confirmacaoEnviada = await notify(NOTIFY_EVENT.aprovada!, ctx, novo);
        await repo.finalizarConfirmacao(ctx.id, confirmacaoEnviada);
      } catch (e) {
        await repo.finalizarConfirmacao(ctx.id, false);
        throw e; // evento fica sem resultado "ok": a nova tentativa do gateway reprocessa
      }
    }
  } else {
    const nome = NOTIFY_EVENT[novo];
    if (nome) await notify(nome, ctx, novo);
  }

  await repo.marcarEvento(ev.key, "ok");
  return { status: "processado", novoStatus: novo, confirmacaoEnviada };
}
