import { json, readJson, sdrHandler } from "../_shared/sdr-http.ts";

Deno.serve(sdrHandler(["POST", "GET"], async (req, sb) => {
  const b = req.method === "POST" ? await readJson(req) : null;
  const limite = Math.min(Math.max(Number.isInteger(b?.limite) ? b!.limite : 8, 1), 20);
  const busca = String(b?.busca ?? "").trim().replace(/[%,()]/g, " ").slice(0, 60);

  let qp = sb.from("procedimentos").select("id,nome,preco_min,preco_max,observacoes").eq("ativo", true).order("nome").limit(limite);
  if (busca) qp = qp.ilike("nome", `%${busca}%`);
  const [proc, cli] = await Promise.all([
    qp,
    sb.from("clinicas").select("id,nome,cidade,estado,endereco,telefone").eq("ativo", true).order("nome").limit(20),
  ]);
  if (proc.error) throw proc.error;
  if (cli.error) throw cli.error;
  return json({
    ok: true,
    procedimentos: proc.data,
    clinicas: cli.data,
    observacao: "Valores de procedimentos são faixas de preço para assinantes. A visita é solicitada e fica sujeita à confirmação da clínica.",
  });
}));
