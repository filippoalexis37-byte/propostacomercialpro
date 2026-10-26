import { normalizePhone } from "./phone";

// Simple template generator based on prospecting status and last attempt result.
// In a real project these templates would be richer and possibly stored externally.
export function generateScript(company: any): string {
  const status = company.prospecting_status ?? "";
  const lastResult = company.last_attempt_result ?? "";
  const name = company.name ?? "Cliente";
  const service = company.services_interest ?? "seu serviço";
  const objection = company.notes ?? "";

  // Helper to include optional sections
  const maybeObjection = objection ? `\nObjeção identificada: ${objection}` : "";

  // Basic mapping – can be expanded later
  const templates: Record<string, string> = {
    "Primeiro contato": `Olá ${name}, tudo bem? Vi que vocês têm interesse em ${service}. Gostaria de conversar sobre como podemos ajudar.`,
    "Follow-up 1": `Oi ${name}, estou seguindo nossa proposta sobre ${service}. Alguma dúvida?${maybeObjection}`,
    "Follow-up 2": `Olá ${name}, lembro que ainda não tivemos retorno sobre ${service}. Podemos agendar uma breve chamada?${maybeObjection}`,
    "Negociação": `Bom dia ${name}, estamos quase fechando o contrato para ${service}. Qual seria o melhor horário para finalizarmos?${maybeObjection}`,
    "" : `Olá ${name}, como podemos avançar com ${service}?`,
  };

  // Choose template based on status, fallback to generic
  const base = templates[status] ?? templates[""];

  // If last attempt result indicates no answer, we may use a softer tone
  if (lastResult && /não respondeu/i.test(lastResult)) {
    return base + "\n\nAguardo seu retorno.";
  }
  return base;
}
