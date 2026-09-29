import { supabase } from "@/integrations/supabase/client";

// Loosely-typed client for generic CRUD helpers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export const brl = (v: number | null | undefined) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v.length === 10 ? v + "T12:00:00" : v).toLocaleDateString("pt-BR") : "—";

export const LEAD_STATUSES = [
  "Lead novo",
  "Primeiro contato",
  "Em conversa",
  "Proposta enviada",
  "Negociação",
  "Fechado",
  "Perdido",
];
