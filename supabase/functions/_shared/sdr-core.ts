// Helpers puros (sem I/O) usados pelas funções sdr-* e pelo checkout-webhook. Cobertos por testes.

export function onlyDigits(v: unknown): string {
  return String(v ?? "").replace(/\D/g, "");
}

export function isValidCpf(input: unknown): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidEmail(v: unknown): boolean {
  const s = String(v ?? "").trim();
  return s.length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

/** Telefone canônico (55 + DDD + número) ou null. */
export function normalizePhone(input: unknown): string | null {
  let d = onlyDigits(input);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  return "55" + d;
}

/** Todas as variantes: com/sem 55, com/sem o 9 depois do DDD. */
export function phoneVariants(input: unknown): string[] {
  const canon = normalizePhone(input);
  if (!canon) return [];
  const nat = canon.slice(2);
  const ddd = nat.slice(0, 2);
  const rest = nat.slice(2);
  const nationals = new Set<string>([nat]);
  if (rest.length === 9 && rest.startsWith("9")) nationals.add(ddd + rest.slice(1));
  if (rest.length === 8) nationals.add(ddd + "9" + rest);
  const out = new Set<string>();
  for (const n of nationals) { out.add(n); out.add("55" + n); }
  return [...out];
}

/** Dois telefones são o mesmo aparelho (ignora 55 e o nono dígito)? */
export function samePhone(a: unknown, b: unknown): boolean {
  const va = new Set(phoneVariants(a));
  return phoneVariants(b).some((v) => va.has(v));
}

export function maskCpf(v: unknown): string | null {
  const d = onlyDigits(v);
  if (d.length !== 11) return d ? "***" : null;
  return `***.${d.slice(3, 6)}.***-${d.slice(9)}`;
}
export function maskEmail(v: unknown): string {
  const s = String(v ?? "");
  const [u, dom] = s.split("@");
  if (!dom) return "***";
  return `${u.slice(0, 2)}***@${dom}`;
}
export function maskPhone(v: unknown): string {
  const d = onlyDigits(v);
  return d.length > 4 ? `***${d.slice(-4)}` : "***";
}
export function maskRef(v: unknown): string {
  const s = String(v ?? "");
  return s.length > 6 ? `${s.slice(0, 3)}***${s.slice(-3)}` : "***";
}

export interface Plano {
  codigo: string;
  nome: string;
  valor_cartao_centavos: number | null;
  desconto_pix_centavos: number | null;
  meses_validade: number;
  checkout_cartao_url: string | null;
  ativo: boolean;
}

export interface Preco {
  metodo: "pix" | "cartao";
  bruto_centavos: number;
  desconto_centavos: number;
  total_centavos: number;
  itens: { codigo: string; nome: string; preco_centavos: number; quantidade: number }[];
  links_cartao: string[];
}

/** Preço calculado no servidor. Lança se o plano principal não estiver utilizável. */
export function calcularPreco(planos: Plano[], metodo: "pix" | "cartao", qtdDependentes: number): Preco {
  const principal = planos.find((p) => p.codigo === "principal" && p.ativo);
  if (!principal || !Number.isInteger(principal.valor_cartao_centavos)) throw new Error("plano_principal_indisponivel");
  const itens: Preco["itens"] = [{ codigo: "principal", nome: principal.nome, preco_centavos: principal.valor_cartao_centavos!, quantidade: 1 }];
  let desconto = metodo === "pix" ? (principal.desconto_pix_centavos ?? 0) : 0;
  const links = [principal.checkout_cartao_url].filter(Boolean) as string[];
  const dep = planos.find((p) => p.codigo === "dependente" && p.ativo && Number.isInteger(p.valor_cartao_centavos));
  const qtd = Math.max(0, Math.floor(qtdDependentes || 0));
  if (dep && qtd > 0) {
    itens.push({ codigo: "dependente", nome: dep.nome, preco_centavos: dep.valor_cartao_centavos!, quantidade: qtd });
    if (metodo === "pix") desconto += (dep.desconto_pix_centavos ?? 0) * qtd;
    if (dep.checkout_cartao_url) links.push(dep.checkout_cartao_url);
  }
  const bruto = itens.reduce((s, i) => s + i.preco_centavos * i.quantidade, 0);
  return { metodo, bruto_centavos: bruto, desconto_centavos: desconto, total_centavos: bruto - desconto, itens, links_cartao: links };
}

export function faltandoDados(a: { nome?: string | null; email?: string | null; cpf?: string | null }): string[] {
  const f: string[] = [];
  if (!a.nome || !String(a.nome).trim()) f.push("nome");
  if (!a.email) f.push("email");
  if (!a.cpf) f.push("cpf");
  return f;
}

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

/** Comparação em tempo constante (faz hash dos dois lados para igualar o tamanho). */
export async function safeEqual(a: string | null | undefined, b: string | null | undefined): Promise<boolean> {
  if (!a || !b) return false;
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export async function eventKey(gatewayRef: string, status: string, ts: string): Promise<string> {
  const h = await sha256(`${gatewayRef}|${status}|${ts}`);
  return [...h].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type CobrancaStatus = "pendente" | "aprovada" | "recusada" | "expirada" | "reembolsada" | "chargeback" | "cancelada";

/** Status do Vega -> status da cobrança; null = sem transição (pending, in_process...). */
export function mapVegaStatus(s: unknown): CobrancaStatus | null {
  switch (String(s ?? "").toLowerCase()) {
    case "approved": case "paid": return "aprovada";
    case "refused": case "failed": return "recusada";
    case "expired": return "expirada";
    case "refunded": return "reembolsada";
    case "chargeback": case "charge_back": return "chargeback";
    case "cancelled": case "canceled": return "cancelada";
    default: return null;
  }
}

export const NOTIFY_EVENT: Partial<Record<CobrancaStatus, string>> = {
  aprovada: "pagamento_aprovado",
  recusada: "pagamento_recusado",
  expirada: "pagamento_expirado",
};

/** Normaliza os dois formatos do Vega (notificação Pix com `tansaction_token`, e webhook de venda). */
export function normalizeVegaPayload(p: Record<string, any>) {
  const data = (p && typeof p.data === "object" && p.data) ? { ...p.data, ...p } : (p ?? {});
  const gatewayRef = data.transaction_token || data.tansaction_token || data.order_id || null;
  const rawStatus = data.status || data.payment_status || "pending";
  const ts = data.approved_at || data.date_approved || data.updated_at || data.created_at || "";
  const externalCode = data.external_code || data.payment?.external_code || null;
  const amountRaw = data.total_price ?? data.amount ?? data.payment_value ?? null;
  const amount = amountRaw === null || amountRaw === "" || !Number.isFinite(Number(amountRaw)) ? null : Number(amountRaw);
  return {
    gatewayRef: gatewayRef ? String(gatewayRef) : null,
    rawStatus: String(rawStatus).toLowerCase(),
    ts: String(ts),
    externalCode: externalCode ? String(externalCode) : null,
    customer: (data.customer ?? null) as Record<string, any> | null,
    method: (data.method || data.payment_method || null) as string | null,
    amount,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown) => typeof v === "string" && UUID_RE.test(v);

/** Decisão de idempotência do sdr-cobranca antes de tocar o gateway. */
export function resolveCobranca<T>(o: { byKey: T | null; pending: T | null; adesaoStatus: string }):
  { action: "existing"; cobranca: T } | { action: "ja_paga" } | { action: "create" } {
  if (o.byKey) return { action: "existing", cobranca: o.byKey };
  if (o.adesaoStatus === "paga") return { action: "ja_paga" };
  if (o.pending) return { action: "existing", cobranca: o.pending };
  return { action: "create" };
}

export function appendExternalCode(url: string, code: string): string {
  const u = new URL(url);
  u.searchParams.set("external_code", code);
  return u.toString();
}

/** Valor recebido cobre o valor da cobrança? (cartão pode vir com juros, então só barra pagamento a menor). Sem valor no payload, aceita. */
export function valorSuficiente(recebido: number | null, esperado: number): boolean {
  if (recebido === null) return true;
  return recebido >= esperado;
}

/** Cobrança aprovada não volta para recusada/expirada/cancelada por evento atrasado. */
export function transicaoPermitida(atual: string, novo: CobrancaStatus): boolean {
  if (atual === novo) return true; // reaplicar o mesmo status é idempotente
  if (atual === "aprovada") return novo === "reembolsada" || novo === "chargeback";
  if (atual === "reembolsada" || atual === "chargeback") return false;
  return true;
}

// ---------------------------------------------------------------- agenda de visitas

export const AGENDA_TZ_OFFSET = "-03:00"; // America/Sao_Paulo (sem horário de verão desde 2019)

/** Interpreta data da visita. Sem fuso => horário de Brasília. Retorna null se inválida. */
export function parseDataVisita(input: unknown): Date | null {
  const s = String(input ?? "").trim();
  if (!s) return null;
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
  const norm = hasZone ? s : `${s.length === 10 ? s + "T09:00:00" : s}${AGENDA_TZ_OFFSET}`;
  const d = new Date(norm);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type MotivoHorario = "ok" | "passado" | "muito_cedo" | "muito_longe" | "fim_de_semana" | "fora_do_horario";

/** Segunda a sexta, início entre 09:00 e 16:59 (Brasília), de 2 horas até 90 dias à frente. */
export function validarHorarioVisita(d: Date, agora: Date = new Date()): MotivoHorario {
  if (d.getTime() <= agora.getTime()) return "passado";
  if (d.getTime() < agora.getTime() + 2 * 3600_000) return "muito_cedo";
  if (d.getTime() > agora.getTime() + 90 * 86400_000) return "muito_longe";
  const br = new Date(d.getTime() - 3 * 3600_000); // campos UTC == relógio de Brasília
  const dow = br.getUTCDay();
  if (dow === 0 || dow === 6) return "fim_de_semana";
  const h = br.getUTCHours();
  if (h < 9 || h >= 17) return "fora_do_horario";
  return "ok";
}

export function statusVisita(status: string | null | undefined): string {
  switch (status) {
    case "solicitada": case "em_analise": return "aguardando confirmação da clínica";
    case "aguardando_cliente": return "nova data proposta pela clínica, aguardando resposta do cliente";
    case "confirmada": return "confirmada";
    case "realizada": return "realizada";
    case "cancelada": return "cancelada";
    default: return String(status ?? "desconhecido");
  }
}
