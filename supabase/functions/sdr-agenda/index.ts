import { normalizePhone, statusVisita } from "../_shared/sdr-core.ts";
import { fail, json, readJson, sdrHandler } from "../_shared/sdr-http.ts";
import { findUsuarioByPhone } from "../_shared/sdr-db.ts";

Deno.serve(sdrHandler(["POST"], async (req, sb) => {
  const b = await readJson(req);
  const telefone = normalizePhone(b?.telefone);
  if (!telefone) return fail(400, "telefone_invalido", "Telefone inválido");
  const u = await findUsuarioByPhone(sb, telefone);
  if (!u) return json({ ok: true, encontrado: false, visitas: [] });

  const desde = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data, error } = await sb.from("ordens_servico")
    .select("id,status,data_solicitada,data_confirmada,data_proposta_admin,clinicas(nome,cidade,endereco,telefone)")
    .eq("cliente_id", u.id).gte("data_solicitada", desde).neq("status", "cancelada")
    .order("data_solicitada", { ascending: true }).limit(10);
  if (error) throw error;
  return json({
    ok: true, encontrado: true,
    visitas: (data ?? []).map((o: any) => ({
      id: o.id, status: statusVisita(o.status), data_solicitada: o.data_solicitada,
      data_confirmada: o.data_confirmada, data_proposta_clinica: o.data_proposta_admin,
      clinica: o.clinicas,
    })),
  });
}));
