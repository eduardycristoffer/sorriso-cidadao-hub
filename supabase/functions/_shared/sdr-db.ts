import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { normalizePhone, onlyDigits, phoneVariants, type Plano } from "./sdr-core.ts";

/** Acha o usuário cujo telefone (possivelmente formatado) bate com qualquer variante. */
export async function findUsuarioByPhone(sb: SupabaseClient, phone: string) {
  const variants = new Set(phoneVariants(phone));
  if (!variants.size) return null;
  const last8 = [...variants][0].slice(-8);
  const pattern = "%" + last8.split("").join("%") + "%";
  const { data, error } = await sb.from("usuarios")
    .select("id,nome,email,cpf,telefone,assinatura_status,assinatura_validade,ativo")
    .ilike("telefone", pattern).limit(50);
  if (error) throw error;
  const canon = new Set([...variants].map((v) => normalizePhone(v)));
  return (data ?? []).find((u) => {
    const n = normalizePhone(onlyDigits(u.telefone));
    return n && (canon.has(n) || variants.has(onlyDigits(u.telefone)));
  }) ?? null;
}

export async function loadPlanos(sb: SupabaseClient): Promise<Plano[]> {
  const { data, error } = await sb.from("planos").select("*");
  if (error) throw error;
  return (data ?? []) as Plano[];
}

export async function getConfig(sb: SupabaseClient, chave: string): Promise<string | null> {
  const { data } = await sb.from("configuracoes").select("valor").eq("chave", chave).maybeSingle();
  const v = data?.valor?.trim();
  return v ? v : null;
}

export const OPEN_ADESAO = ["rascunho", "aguardando_pagamento"];
