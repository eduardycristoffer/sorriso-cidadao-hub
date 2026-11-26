import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";
import { safeEqual } from "./sdr-core.ts";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sdr-key, x-webhook-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
export function fail(status: number, code: string, message: string, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, code, message, ...extra }, status);
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

/** Envolve um handler sdr-*: CORS, método, autenticação x-sdr-key e envelope de erro. */
export function sdrHandler(methods: string[], fn: (req: Request, sb: SupabaseClient) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (!methods.includes(req.method)) return fail(405, "metodo_invalido", "Método não permitido");
    const expected = Deno.env.get("SDR_API_KEY");
    if (!(await safeEqual(req.headers.get("x-sdr-key"), expected))) return fail(401, "nao_autorizado", "Chave inválida");
    try {
      return await fn(req, adminClient());
    } catch (e) {
      console.error("sdr erro:", (e as Error)?.message);
      return fail(500, "erro_interno", "Erro interno");
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, any> | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? b : null;
  } catch { return null; }
}

export const optInt = (v: unknown) => v === undefined || v === null || (Number.isInteger(v) && (v as number) >= 0);
