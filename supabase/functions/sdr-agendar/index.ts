import { isUuid, normalizePhone, parseDataVisita, statusVisita, validarHorarioVisita } from "../_shared/sdr-core.ts";
import { fail, json, optInt, readJson, sdrHandler } from "../_shared/sdr-http.ts";
import { findUsuarioByPhone } from "../_shared/sdr-db.ts";

const MOTIVOS: Record<string, string> = {
  passado: "A data já passou.",
  muito_cedo: "Precisa ser com pelo menos 2 horas de antecedência.",
  muito_longe: "Só agendamos até 90 dias à frente.",
  fim_de_semana: "A clínica atende de segunda a sexta.",
  fora_do_horario: "Horário de visita: das 09:00 às 17:00 (início até 16:59).",
};

Deno.serve(sdrHandler(["POST"], async (req, sb) => {
  const b = await readJson(req);
  if (!b) return fail(400, "json_invalido", "Corpo inválido");
  const telefone = normalizePhone(b.telefone);
  if (!telefone) return fail(400, "telefone_invalido", "Telefone inválido");
  if (!isUuid(b.clinica_id)) return fail(400, "campo_invalido", "clinica_id inválido");
  if (b.procedimento_id && !isUuid(b.procedimento_id)) return fail(400, "campo_invalido", "procedimento_id inválido");
  if (!optInt(b.crm_conversation_id)) return fail(400, "campo_invalido", "crm_conversation_id inválido");
  if (typeof b.idempotency_key !== "string" || b.idempotency_key.length < 8 || b.idempotency_key.length > 200) {
    return fail(400, "campo_invalido", "idempotency_key (8-200 caracteres) obrigatório");
  }
  const data = parseDataVisita(b.data_solicitada);
  if (!data) return fail(400, "data_invalida", "Data inválida. Use AAAA-MM-DDTHH:MM:SS (horário de Brasília).");
  const motivo = validarHorarioVisita(data);
  if (motivo !== "ok") return fail(422, "horario_invalido", MOTIVOS[motivo] ?? "Horário inválido", { motivo });

  const u = await findUsuarioByPhone(sb, telefone);
  if (!u) return fail(404, "cliente_nao_encontrado", "Telefone sem cadastro de assinante");
  const ativa = u.ativo !== false && u.assinatura_status === "ATIVA" &&
    (!u.assinatura_validade || new Date(u.assinatura_validade) > new Date());
  if (!ativa) return fail(403, "assinatura_inativa", "Assinatura não está ativa");

  const { data: clinica } = await sb.from("clinicas").select("id,nome,cidade,endereco,telefone,ativo").eq("id", b.clinica_id).maybeSingle();
  if (!clinica || clinica.ativo === false) return fail(404, "clinica_nao_encontrada", "Clínica indisponível");

  const jaExiste = async () => {
    const { data: o } = await sb.from("ordens_servico").select("id,status,data_solicitada")
      .eq("idempotency_key", b.idempotency_key).maybeSingle();
    return o;
  };
  const resposta = (o: { id: string; status: string | null; data_solicitada: string }, reutilizada: boolean) =>
    json({
      ok: true, reutilizada,
      visita: {
        id: o.id, status: statusVisita(o.status), data_solicitada: o.data_solicitada,
        clinica: { nome: clinica.nome, cidade: clinica.cidade, endereco: clinica.endereco, telefone: clinica.telefone },
      },
      aviso: "Pedido registrado e sujeito à confirmação da clínica, que pode confirmar ou propor outra data.",
    });

  const ex = await jaExiste();
  if (ex) return resposta(ex, true);

  const row: Record<string, unknown> = {
    cliente_id: u.id,
    clinica_id: b.clinica_id,
    procedimento_id: b.procedimento_id ?? null,
    data_solicitada: data.toISOString(),
    observacoes_cliente: b.observacoes ? String(b.observacoes).slice(0, 500) : null,
    status: "solicitada",
    origem: "sdr_whatsapp",
    crm_conversation_id: b.crm_conversation_id ?? null,
    idempotency_key: b.idempotency_key,
  };
  if (!b.procedimento_id) row.nome_procedimento_manual = "Visita / avaliação (agendada pelo WhatsApp)";

  const ins = await sb.from("ordens_servico").insert(row).select("id,status,data_solicitada").single();
  if (ins.error?.code === "23505") {
    const o = await jaExiste();
    if (o) return resposta(o, true);
  }
  if (ins.error) throw ins.error;
  return resposta(ins.data, false);
}));
