/* eslint-disable @typescript-eslint/no-explicit-any */
export const STAGES = [
  "Não prospectado", "Primeiro contato", "Tentativa realizada", "Respondeu", "Qualificado",
  "Reunião/Diagnóstico", "Proposta enviada", "Negociação", "Fechado", "Cliente",
];
export const LOST = ["Sem interesse", "Não respondeu", "Número inválido", "Empresa fechada", "Fora do perfil", "Duplicado"];
export const ALL_STATUS = [...STAGES, ...LOST];
export const CHANNELS = ["WhatsApp", "Telefone", "E-mail", "Instagram", "Facebook", "LinkedIn", "Reunião", "Outro"];
export const RESULTS = ["Não respondeu", "Respondeu", "Interessado", "Sem interesse", "Pediu proposta", "Pediu retorno", "Número inválido", "Empresa fechada", "Fora do perfil", "Outro"];
export const CONTACT_TYPES = ["Primeiro contato", "Follow-up", "Qualificação", "Reunião", "Proposta enviada", "Negociação", "Outro"];
export const SOURCES = ["Google Maps", "Google", "Instagram", "Facebook", "Indicação", "Site", "Formulário", "Prospecção manual", "Lista importada", "Evento", "Networking", "Outro"];
export const PRIORITIES = ["Alta", "Média", "Baixa"];
export const POTENTIALS = ["Alto", "Médio", "Baixo"];
export const TEMPS = ["Frio", "Morno", "Quente", "Muito quente"];
export const SERVICES_INTEREST = ["Google Ads", "Meta Ads", "Social Media", "SEO", "Google Business Profile", "Landing Page", "Site", "Automação", "WhatsApp", "Consultoria", "Pesquisa de mercado", "Prospecção B2B", "Gestão de delivery", "Outro"];
export const QUALIFY_YESNO = [
  ["digital", "Tem presença digital?"], ["ads", "Investe em anúncios?"], ["site", "Possui site?"],
  ["gbp", "Possui Google Business Profile?"], ["insta", "Possui Instagram?"], ["wa", "Possui WhatsApp?"],
  ["sales_team", "Possui equipe comercial?"], ["agency", "Já trabalha com agência?"], ["decider", "Decisor identificado?"],
] as const;
export const LIST_STATUS = ["Rascunho", "Em prospecção", "Pausada", "Concluída"];

/** Company status after a contact result (keeps advanced stages). */
export function statusFromResult(result: string, type: string, current: string) {
  if (type === "Proposta enviada") return "Proposta enviada";
  if (type === "Negociação") return "Negociação";
  if (type === "Reunião") return "Reunião/Diagnóstico";
  const map: Record<string, string> = {
    "Respondeu": "Respondeu", "Pediu retorno": "Respondeu", "Interessado": "Qualificado", "Pediu proposta": "Qualificado",
    "Sem interesse": "Sem interesse", "Número inválido": "Número inválido", "Empresa fechada": "Empresa fechada", "Fora do perfil": "Fora do perfil",
  };
  if (map[result]) {
    const next = map[result]!;
    if (STAGES.includes(next) && STAGES.indexOf(current) > STAGES.indexOf(next)) return current;
    return next;
  }
  if (result === "Não respondeu") return STAGES.indexOf(current) > 2 ? current : current === "Não prospectado" ? "Primeiro contato" : "Tentativa realizada";
  return current === "Não prospectado" ? "Primeiro contato" : current;
}

/** Automatic temperature from qualification answers. */
export function calcTemperature(c: any) {
  const q = c.qualification ?? {};
  let s = 0;
  if (q.decider) s += 2;
  if (q.urgency === "Alta") s += 2; else if (q.urgency === "Média") s += 1;
  if (Number(q.budget) > 0) s += 1;
  if ((c.services_interest ?? []).length) s += 1;
  if (["Qualificado", "Reunião/Diagnóstico", "Proposta enviada", "Negociação"].includes(c.prospect_status)) s += 2;
  return s >= 6 ? "Muito quente" : s >= 4 ? "Quente" : s >= 2 ? "Morno" : "Frio";
}

export const IN_CONTACT = ["Respondeu", "Qualificado", "Reunião/Diagnóstico", "Negociação"];
export const QUALIFIED = ["Qualificado", "Reunião/Diagnóstico", "Proposta enviada", "Negociação", "Fechado", "Cliente"];
export const PROPOSAL = ["Proposta enviada", "Negociação", "Fechado", "Cliente"];
export const WON = ["Fechado", "Cliente"];

export function stats(rows: any[]) {
  const t = new Date().toISOString().slice(0, 10);
  const n = rows.length;
  const prosp = rows.filter((c) => c.attempts > 0).length;
  const responded = rows.filter((c) => [...IN_CONTACT, ...PROPOSAL, "Sem interesse"].includes(c.prospect_status)).length;
  const qualified = rows.filter((c) => QUALIFIED.includes(c.prospect_status)).length;
  const proposals = rows.filter((c) => PROPOSAL.includes(c.prospect_status)).length;
  const won = rows.filter((c) => WON.includes(c.prospect_status)).length;
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  return {
    total: n, prosp, notProsp: n - prosp,
    inContact: rows.filter((c) => IN_CONTACT.includes(c.prospect_status)).length,
    qualified, proposals, won,
    noInterest: rows.filter((c) => c.prospect_status === "Sem interesse").length,
    noAnswer: rows.filter((c) => c.prospect_status === "Não respondeu" || (c.last_result === "Não respondeu" && c.attempts > 0)).length,
    today: rows.filter((c) => c.next_contact_at === t && !LOST.includes(c.prospect_status) && !WON.includes(c.prospect_status)).length,
    late: rows.filter((c) => c.next_contact_at && c.next_contact_at < t && !LOST.includes(c.prospect_status) && !WON.includes(c.prospect_status)).length,
    potential: rows.reduce((a, c) => a + (Number(c.potential_value) || 0), 0),
    closed: rows.filter((c) => WON.includes(c.prospect_status)).reduce((a, c) => a + (Number(c.closed_value || c.potential_value) || 0), 0),
    pctProsp: pct(prosp, n), respRate: pct(responded, prosp), qualRate: pct(qualified, prosp), propRate: pct(proposals, prosp), convRate: pct(won, prosp),
  };
}

const norm = (s: any) => String(s ?? "").toLowerCase().replace(/\D/g, "");
const txt = (s: any) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
/** Returns the existing company that looks like the same business, if any. */
export function findDuplicate(c: any, existing: any[]) {
  return existing.find((e) =>
    (c.cnpj && norm(e.cnpj) && norm(e.cnpj) === norm(c.cnpj)) ||
    (c.phone && norm(c.phone).length >= 8 && [norm(e.phone), norm(e.whatsapp)].includes(norm(c.phone))) ||
    (c.whatsapp && norm(c.whatsapp).length >= 8 && [norm(e.phone), norm(e.whatsapp)].includes(norm(c.whatsapp))) ||
    (c.email && e.email && txt(e.email) === txt(c.email)) ||
    (c.address && e.address && txt(e.name) === txt(c.name) && txt(e.address) === txt(c.address)),
  );
}

export function parseCsv(text: string): Record<string, string>[] {
  const sep = (text.split("\n")[0] ?? "").includes(";") ? ";" : ",";
  const rows: string[][] = [];
  let cur: string[] = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === sep) { cur.push(f); f = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; cur.push(f); rows.push(cur); cur = []; f = ""; }
    else f += ch;
  }
  if (f || cur.length) { cur.push(f); rows.push(cur); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  const keys = head.map((h) => txt(h));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

const MAP: Record<string, string[]> = {
  name: ["empresa", "nome fantasia", "nome", "razao social", "title"], owner_name: ["responsavel", "contato"],
  niche: ["nicho", "categoria", "segmento"], city: ["cidade"], state: ["estado", "uf"], address: ["endereco"],
  district: ["bairro"], phone: ["telefone", "fone", "phone"], whatsapp: ["whatsapp", "celular"], email: ["e-mail", "email"],
  website: ["site", "website"], instagram: ["instagram"], gbp_url: ["google", "google maps", "link"], source: ["origem"], cnpj: ["cnpj"],
};
export function mapCsvRow(r: Record<string, string>) {
  const out: any = {};
  for (const [k, alts] of Object.entries(MAP)) for (const a of alts) if (r[a] && !out[k]) out[k] = r[a];
  if (!out.name && r["nome"]) out.name = r["nome"];
  out.source = out.source || "Lista importada";
  return out;
}
