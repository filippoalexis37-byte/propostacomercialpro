import { supabase } from "@/integrations/supabase/client";

// Loosely-typed client for generic CRUD helpers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export const brl = (v: number | null | undefined) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (v: string | null | undefined) =>
  v ? new Date(v.length === 10 ? v + "T12:00:00" : v).toLocaleDateString("pt-BR") : "—";

export const fmtDateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("pt-BR") : "—";

export const LEAD_STATUSES = [
  "Lead novo",
  "Primeiro contato",
  "Em conversa",
  "Proposta enviada",
  "Negociação",
  "Fechado",
  "Perdido",
];

// ─── Prospecção B2B ───────────────────────────────────────────────────────────

export const PROSPECTING_STATUSES = [
  "Não prospectado",
  "Primeiro contato",
  "Tentativa realizada",
  "Respondeu",
  "Qualificado",
  "Reunião/Diagnóstico",
  "Proposta enviada",
  "Negociação",
  "Fechado",
  "Cliente",
  // Negativos
  "Sem interesse",
  "Não respondeu",
  "Número inválido",
  "Empresa fechada",
  "Fora do perfil",
  "Duplicado",
] as const;

export type ProspectingStatus = (typeof PROSPECTING_STATUSES)[number];

export const ACTIVE_PROSPECTING_STATUSES: ProspectingStatus[] = [
  "Não prospectado",
  "Primeiro contato",
  "Tentativa realizada",
  "Respondeu",
  "Qualificado",
  "Reunião/Diagnóstico",
  "Proposta enviada",
  "Negociação",
];

export const NEGATIVE_PROSPECTING_STATUSES: ProspectingStatus[] = [
  "Sem interesse",
  "Não respondeu",
  "Número inválido",
  "Empresa fechada",
  "Fora do perfil",
  "Duplicado",
];

export const PROSPECTING_STATUS_COLORS: Record<string, string> = {
  "Não prospectado":     "bg-gray-100 text-gray-700 border-gray-200",
  "Primeiro contato":    "bg-blue-100 text-blue-700 border-blue-200",
  "Tentativa realizada": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "Respondeu":           "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Qualificado":         "bg-purple-100 text-purple-700 border-purple-200",
  "Reunião/Diagnóstico": "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Proposta enviada":    "bg-orange-100 text-orange-700 border-orange-200",
  "Negociação":          "bg-amber-100 text-amber-700 border-amber-200",
  "Fechado":             "bg-green-100 text-green-700 border-green-200",
  "Cliente":             "bg-green-200 text-green-800 border-green-300",
  "Sem interesse":       "bg-red-100 text-red-700 border-red-200",
  "Não respondeu":       "bg-slate-100 text-slate-600 border-slate-200",
  "Número inválido":     "bg-red-50 text-red-500 border-red-100",
  "Empresa fechada":     "bg-gray-200 text-gray-600 border-gray-300",
  "Fora do perfil":      "bg-zinc-100 text-zinc-600 border-zinc-200",
  "Duplicado":           "bg-stone-100 text-stone-600 border-stone-200",
};

export const PROSPECTING_STATUS_ICONS: Record<string, string> = {
  "Não prospectado":     "⚪",
  "Primeiro contato":    "🔵",
  "Tentativa realizada": "🟡",
  "Respondeu":           "🔵",
  "Qualificado":         "🟣",
  "Reunião/Diagnóstico": "🟣",
  "Proposta enviada":    "🟠",
  "Negociação":          "🟠",
  "Fechado":             "🟢",
  "Cliente":             "🟢",
  "Sem interesse":       "🔴",
  "Não respondeu":       "⚪",
  "Número inválido":     "🔴",
  "Empresa fechada":     "🔴",
  "Fora do perfil":      "🔴",
  "Duplicado":           "⚪",
};

export const ATTEMPT_CHANNELS = [
  "WhatsApp", "Telefone", "E-mail", "Instagram",
  "Facebook", "LinkedIn", "Reunião", "Outro",
] as const;

export const ATTEMPT_RESULTS = [
  "Não respondeu", "Respondeu", "Interessado", "Sem interesse",
  "Pediu proposta", "Pediu retorno", "Número inválido",
  "Empresa fechada", "Fora do perfil", "Outro",
] as const;

export const ATTEMPT_TYPES = [
  "Primeiro contato", "Follow-up", "Qualificação",
  "Apresentação", "Diagnóstico", "Proposta", "Negociação",
] as const;

export const PROSPECTING_PRIORITIES = ["Alta", "Média", "Baixa"] as const;
export const PROSPECTING_POTENTIALS = ["Alto", "Médio", "Baixo"] as const;
export const TEMPERATURES = ["Muito quente", "Quente", "Morno", "Frio"] as const;

export const LEAD_SOURCES_DEFAULT = [
  "Google Maps", "Google", "Instagram", "Facebook",
  "Indicação", "Site", "Formulário", "Prospecção manual",
  "Lista importada", "Evento", "Networking", "Outro",
];

export const SERVICES_INTEREST_OPTIONS = [
  "Google Ads", "Meta Ads", "Social Media", "SEO",
  "Google Business Profile", "Landing Page", "Site",
  "Automação", "WhatsApp", "Consultoria",
  "Pesquisa de mercado", "Prospecção B2B",
  "Gestão de delivery", "Outro",
];

export const DEFAULT_NICHES = [
  "Serralheria", "Ar-condicionado", "Hamburgueria", "Restaurantes",
  "Pizzarias", "Salão de beleza", "Esmalteria", "Barbearia",
  "Pet shop", "Clínica", "Dentista", "Imobiliária",
  "Loja de cosméticos", "Academia", "Oficina mecânica",
  "Marcenaria", "Elétrica", "Hidráulica", "Construção",
  "Contabilidade", "Advocacia", "Empresas de serviços",
  "Compra de ouro", "E-commerce", "Comércio local",
];

export const LIST_STATUSES = ["Rascunho", "Em prospecção", "Pausada", "Concluída"] as const;
