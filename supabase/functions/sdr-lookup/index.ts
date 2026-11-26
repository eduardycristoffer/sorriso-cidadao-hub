import { faltandoDados, maskCpf, normalizePhone } from "../_shared/sdr-core.ts";
import { fail, json, readJson, sdrHandler } from "../_shared/sdr-http.ts";
import { findUsuarioByPhone, OPEN_ADESAO } from "../_shared/sdr-db.ts";

Deno.serve(sdrHandler(["POST"], async (req, sb) => {
  const body = await readJson(req);
  const phone = normalizePhone(body?.phone);
  if (!phone) return fail(400, "telefone_invalido", "Telefone inválido");

  const u = await findUsuarioByPhone(sb, phone);
  const { data: adesao } = await sb.from("adesoes").select("id,status,nome,email,cpf,qtd_dependentes")
    .eq("telefone", phone).in("status", OPEN_ADESAO).maybeSingle();

  let dependentes_count = 0;
  if (u) {
    const { count } = await sb.from("dependentes").select("id", { count: "exact", head: true })
      .eq("usuario_id", u.id).eq("ativo", true);
    dependentes_count = count ?? 0;
  }
  const src = { nome: adesao?.nome ?? u?.nome, email: adesao?.email ?? u?.email, cpf: adesao?.cpf ?? u?.cpf };
  return json({
    ok: true,
    found: !!u,
    usuario: u ? { nome: u.nome, email: u.email, cpf_mascarado: maskCpf(u.cpf),
      assinatura_status: u.assinatura_status, assinatura_validade: u.assinatura_validade } : null,
    assinatura_ativa: !!u && u.ativo !== false && u.assinatura_status === "ATIVA" &&
      (!u.assinatura_validade || new Date(u.assinatura_validade) > new Date()),
    dependentes_count,
    adesao_aberta: adesao ? { id: adesao.id, status: adesao.status, qtd_dependentes: adesao.qtd_dependentes } : null,
    faltando: faltandoDados(src),
  });
}));
