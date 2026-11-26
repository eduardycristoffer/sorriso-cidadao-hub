import assert from "node:assert/strict";
import {
  calcularPreco, eventKey, isUuid, isValidCpf, mapVegaStatus, normalizePhone, normalizeVegaPayload, parseDataVisita,
  phoneVariants, resolveCobranca, safeEqual, samePhone, transicaoPermitida, validarHorarioVisita, valorSuficiente,
  appendExternalCode, faltandoDados, type Plano,
} from "./sdr-core.ts";
import { processarEventoSdr, type CobrancaCtx, type EventoNormalizado, type WebhookRepo } from "./sdr-webhook.ts";

const principal: Plano = { codigo: "principal", nome: "Cartão", valor_cartao_centavos: 5942, desconto_pix_centavos: 2952, meses_validade: 12, checkout_cartao_url: "https://c.example/A", ativo: true };
const dependente: Plano = { codigo: "dependente", nome: "Dep", valor_cartao_centavos: 2988, desconto_pix_centavos: null, meses_validade: 12, checkout_cartao_url: "https://c.example/B", ativo: false };

Deno.test("CPF e telefone", () => {
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("111.111.111-11"), false);
  assert.equal(normalizePhone("(62) 99832-4987"), "5562998324987");
  assert.equal(normalizePhone("+55 62 9231-1554"), "556292311554");
  assert.equal(normalizePhone("123"), null);
  // com e sem o nono dígito, com e sem 55 => mesmo aparelho
  assert.equal(samePhone("5562992311554", "556292311554"), true);
  assert.equal(samePhone("62998324987", "+55 62 99832-4987"), true);
  assert.equal(samePhone("62998324987", "62981103730"), false);
  assert.ok(phoneVariants("62981103730").includes("556281103730"));
});

Deno.test("preço: Pix 29,90, cartão 59,42, dependente inativo ignorado", () => {
  const pix = calcularPreco([principal, dependente], "pix", 0);
  assert.equal(pix.total_centavos, 2990);
  assert.equal(pix.desconto_centavos, 2952);
  const cartao = calcularPreco([principal, dependente], "cartao", 2);
  assert.equal(cartao.total_centavos, 5942); // dependente inativo não entra
  assert.deepEqual(cartao.links_cartao, ["https://c.example/A"]);
  const comDep = calcularPreco([principal, { ...dependente, ativo: true }], "cartao", 2);
  assert.equal(comDep.total_centavos, 5942 + 2 * 2988);
  assert.equal(comDep.links_cartao.length, 2);
  assert.throws(() => calcularPreco([{ ...principal, ativo: false }], "pix", 0), /plano_principal_indisponivel/);
});

Deno.test("status e payload do Vega", () => {
  assert.equal(mapVegaStatus("approved"), "aprovada");
  assert.equal(mapVegaStatus("PAID"), "aprovada");
  assert.equal(mapVegaStatus("refused"), "recusada");
  assert.equal(mapVegaStatus("pending"), null);
  const p = normalizeVegaPayload({ tansaction_token: "tx1", payment_status: "approved", approved_at: "2026-11-26T12:00:00Z", amount: 2990 });
  assert.equal(p.gatewayRef, "tx1");
  assert.equal(p.rawStatus, "approved");
  assert.equal(p.amount, 2990);
  assert.equal(normalizeVegaPayload({}).amount, null);
});

Deno.test("idempotência e transições", () => {
  assert.equal(resolveCobranca({ byKey: null, pending: null, adesaoStatus: "rascunho" }).action, "create");
  assert.equal(resolveCobranca({ byKey: null, pending: null, adesaoStatus: "paga" }).action, "ja_paga");
  assert.equal(resolveCobranca({ byKey: null, pending: { id: 1 }, adesaoStatus: "aguardando_pagamento" }).action, "existing");
  assert.equal(transicaoPermitida("aprovada", "recusada"), false);
  assert.equal(transicaoPermitida("aprovada", "reembolsada"), true);
  assert.equal(transicaoPermitida("pendente", "aprovada"), true);
  assert.equal(valorSuficiente(null, 2990), true);
  assert.equal(valorSuficiente(2000, 2990), false);
  assert.equal(valorSuficiente(6500, 5942), true); // cartão parcelado pode vir com juros
  assert.equal(isUuid("3f2c1a4e-0000-4000-8000-123456789abc"), true);
  assert.equal(isUuid("x"), false);
  assert.equal(appendExternalCode("https://a.b/c", "123"), "https://a.b/c?external_code=123");
  assert.deepEqual(faltandoDados({ nome: "A", email: null, cpf: null }), ["email", "cpf"]);
});

Deno.test("segurança: comparação constante e chave do evento", async () => {
  assert.equal(await safeEqual("abc", "abc"), true);
  assert.equal(await safeEqual("abc", "abd"), false);
  assert.equal(await safeEqual("abc", undefined), false);
  assert.equal(await safeEqual("", ""), false);
  assert.equal(await eventKey("r", "approved", "t"), await eventKey("r", "approved", "t"));
  assert.notEqual(await eventKey("r", "approved", "t"), await eventKey("r", "refused", "t"));
});

Deno.test("agenda: horário de Brasília, dias úteis, antecedência", () => {
  const agora = new Date("2026-11-26T12:00:00-03:00"); // quinta
  const v = (s: string) => validarHorarioVisita(parseDataVisita(s)!, agora);
  assert.equal(v("2026-11-27T10:00:00"), "ok");          // sexta 10h
  assert.equal(v("2026-11-28T10:00:00"), "fim_de_semana");
  assert.equal(v("2026-11-27T08:00:00"), "fora_do_horario");
  assert.equal(v("2026-11-27T17:00:00"), "fora_do_horario");
  assert.equal(v("2026-11-26T13:00:00"), "muito_cedo");
  assert.equal(v("2026-11-25T10:00:00"), "passado");
  assert.equal(v("2027-06-01T10:00:00"), "muito_longe");
  assert.equal(parseDataVisita("lixo"), null);
  assert.equal(parseDataVisita("2026-11-27")!.toISOString(), "2026-11-27T12:00:00.000Z"); // 09:00 BRT
});

// ---------- webhook: repositório em memória ----------
function memRepo(cob: CobrancaCtx | null) {
  const s = {
    eventos: new Map<string, string | null>(), cob, ativacoes: 0, confirmacao: "nao_enviada", cobStatus: cob?.status ?? "",
  };
  const repo: WebhookRepo = {
    registrarEvento: (e) => {
      if (s.eventos.has(e.key)) return Promise.resolve({ novo: false, resultado: s.eventos.get(e.key) ?? null });
      s.eventos.set(e.key, null); return Promise.resolve({ novo: true, resultado: null });
    },
    marcarEvento: (k, r) => { s.eventos.set(k, r); return Promise.resolve(); },
    acharCobranca: () => Promise.resolve(s.cob ? { ...s.cob, status: s.cobStatus } : null),
    atualizarCobranca: (_id, p) => { if (p.status) s.cobStatus = p.status; return Promise.resolve(); },
    ativarAssinatura: () => { s.ativacoes++; return Promise.resolve(); },
    reivindicarConfirmacao: () => {
      if (s.confirmacao === "nao_enviada") { s.confirmacao = "enviando"; return Promise.resolve(true); }
      return Promise.resolve(false);
    },
    finalizarConfirmacao: (_id, ok) => { s.confirmacao = ok ? "enviada" : "nao_enviada"; return Promise.resolve(); },
  };
  return { s, repo };
}
const ctx: CobrancaCtx = { id: "c1", adesao_id: "a1", metodo: "pix", valor_centavos: 2990, status: "pendente", gateway_ref: "tx1", crm_conversation_id: 77 };
const ev = (over: Partial<EventoNormalizado> = {}): EventoNormalizado => ({
  key: "k1", gatewayRef: "tx1", rawStatus: "approved", externalCode: "c1", customer: null, amount: 2990, payload: {}, ...over,
});

Deno.test("webhook: pagamento aprovado confirma UMA vez, mesmo repetido", async () => {
  const { s, repo } = memRepo(ctx);
  const enviados: string[] = [];
  const notify = (e: string) => { enviados.push(e); return Promise.resolve(true); };

  const r1 = await processarEventoSdr(repo, notify, ev());
  assert.deepEqual(r1, { status: "processado", novoStatus: "aprovada", confirmacaoEnviada: true });
  const r2 = await processarEventoSdr(repo, notify, ev());               // mesmo evento reenviado
  assert.deepEqual(r2, { status: "duplicado" });
  const r3 = await processarEventoSdr(repo, notify, ev({ key: "k2" }));   // outro evento, mesma aprovação
  assert.equal(r3.status, "processado");
  assert.deepEqual(enviados, ["pagamento_aprovado"]);                     // uma única confirmação
  assert.equal(s.confirmacao, "enviada");
  assert.equal(s.cobStatus, "aprovada");
});

Deno.test("webhook: evento atrasado de recusa não derruba pagamento aprovado", async () => {
  const { s, repo } = memRepo(ctx);
  const enviados: string[] = [];
  const notify = (e: string) => { enviados.push(e); return Promise.resolve(true); };
  await processarEventoSdr(repo, notify, ev());
  const r = await processarEventoSdr(repo, notify, ev({ key: "k9", rawStatus: "refused" }));
  assert.equal(r.status, "ignorado");
  assert.equal(s.cobStatus, "aprovada");
  assert.deepEqual(enviados, ["pagamento_aprovado"]);
});

Deno.test("webhook: valor menor que o esperado não ativa nem confirma", async () => {
  const { s, repo } = memRepo(ctx);
  const enviados: string[] = [];
  const r = await processarEventoSdr(repo, (e) => { enviados.push(e); return Promise.resolve(true); }, ev({ amount: 1000 }));
  assert.equal(r.status, "valor_divergente");
  assert.equal(s.ativacoes, 0);
  assert.deepEqual(enviados, ["pagamento_divergente"]);
  assert.equal(s.cobStatus, "pendente");
});

Deno.test("webhook: falha ao avisar o cliente libera nova tentativa sem duplicar", async () => {
  const { s, repo } = memRepo(ctx);
  let falha = true; const enviados: string[] = [];
  const notify = (e: string) => {
    if (falha) return Promise.reject(new Error("n8n_http_500"));
    enviados.push(e); return Promise.resolve(true);
  };
  await assert.rejects(processarEventoSdr(repo, notify, ev()), /n8n_http_500/);
  assert.equal(s.confirmacao, "nao_enviada");
  falha = false;
  const r = await processarEventoSdr(repo, notify, ev());                 // o gateway tenta de novo
  assert.equal(r.status, "processado");
  await processarEventoSdr(repo, notify, ev());                           // e de novo
  assert.deepEqual(enviados, ["pagamento_aprovado"]);
  assert.equal(s.confirmacao, "enviada");
});

Deno.test("webhook: status pendente e cobrança desconhecida", async () => {
  const a = memRepo(ctx);
  const r = await processarEventoSdr(a.repo, () => Promise.resolve(true), ev({ rawStatus: "pending" }));
  assert.equal(r.status, "sem_transicao");
  const b = memRepo(null);
  const r2 = await processarEventoSdr(b.repo, () => Promise.resolve(true), ev());
  assert.equal(r2.status, "nao_sdr");
});
