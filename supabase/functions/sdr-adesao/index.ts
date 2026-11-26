import { faltandoDados, isValidCpf, isValidEmail, normalizePhone, onlyDigits } from "../_shared/sdr-core.ts";
import { fail, json, optInt, readJson, sdrHandler } from "../_shared/sdr-http.ts";
import { findUsuarioByPhone, OPEN_ADESAO } from "../_shared/sdr-db.ts";

Deno.serve(sdrHandler(["POST"], async (req, sb) => {
  const b = await readJson(req);
  if (!b) return fail(400, "json_invalido", "Corpo inválido");
  const telefone = normalizePhone(b.telefone);
  if (!telefone) return fail(400, "telefone_invalido", "Telefone inválido");
  for (const k of ["crm_account_id", "crm_contact_id", "crm_conversation_id", "qtd_dependentes"]) {
    if (!optInt(b[k])) return fail(400, "campo_invalido", `${k} deve ser inteiro >= 0`);
  }
  if (!Number.isInteger(b.crm_account_id)) return fail(400, "campo_invalido", "crm_account_id obrigatório");

  const patch: Record<string, unknown> = {
    crm_account_id: b.crm_account_id,
    crm_contact_id: b.crm_contact_id ?? null,
    crm_conversation_id: b.crm_conversation_id ?? null,
  };
  if (b.nome != null) {
    const nome = String(b.nome).trim();
    if (nome.length < 2 || nome.length > 150) return fail(400, "nome_invalido", "Nome inválido");
    patch.nome = nome;
  }
  if (b.email != null) {
    if (!isValidEmail(b.email)) return fail(400, "email_invalido", "E-mail inválido");
    patch.email = String(b.email).trim().toLowerCase();
  }
  if (b.cpf != null) {
    if (!isValidCpf(b.cpf)) return fail(400, "cpf_invalido", "CPF inválido");
    patch.cpf = onlyDigits(b.cpf);
  }
  if (b.qtd_dependentes != null) patch.qtd_dependentes = b.qtd_dependentes;

  const { data: aberta } = await sb.from("adesoes").select("id").eq("telefone", telefone)
    .in("status", OPEN_ADESAO).maybeSingle();

  let adesao;
  if (aberta) {
    const { data, error } = await sb.from("adesoes").update(patch).eq("id", aberta.id).select().single();
    if (error) throw error;
    adesao = data;
  } else {
    const u = await findUsuarioByPhone(sb, telefone);
    // Cliente já cadastrado: reaproveita o que existe e só pede o que faltar.
    const base: Record<string, unknown> = u
      ? { nome: u.nome, email: u.email, cpf: u.cpf ? onlyDigits(u.cpf) : null }
      : {};
    const row = { telefone, usuario_id: u?.id ?? null, ...base, ...patch };
    const ins = await sb.from("adesoes").insert(row).select().single();
    if (ins.error?.code === "23505") {
      const { data, error } = await sb.from("adesoes").update(patch).eq("telefone", telefone)
        .in("status", OPEN_ADESAO).select().single();
      if (error) throw error;
      adesao = data;
    } else if (ins.error) throw ins.error;
    else adesao = ins.data;
  }

  const { cpf, ...rest } = adesao;
  return json({ ok: true, adesao: { ...rest, cpf_informado: !!cpf }, faltando: faltandoDados(adesao) });
}));
