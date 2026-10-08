/**
 * Utilitários para integração com Google Calendar / Gmail Meet
 */

export interface MeetingDetails {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO string ou YYYY-MM-DDTHH:mm
  durationMinutes?: number;
  clientEmail?: string;
  clientName?: string;
  clientPhone?: string;
}

const ORGANIZER_EMAIL = "lucasmktpro158@gmail.com";

/**
 * Formata data no padrão UTC exigido pelo Google Calendar URL template: YYYYMMDDTHHmmssZ
 */
export function formatGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
}

/**
 * Gera link direto do Google Calendar para agendar reunião com convidados e criar Google Meet
 * Abre direto no Gmail / Google Agenda do usuário lucasmktpro158@gmail.com ou de quem estiver agendando
 */
export function generateGoogleCalendarUrl(details: MeetingDetails): string {
  const start = new Date(details.startDate);
  const duration = details.durationMinutes || 45;
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const datesParam = `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`;

  const attendees: string[] = [ORGANIZER_EMAIL];
  if (details.clientEmail && details.clientEmail.includes("@")) {
    attendees.push(details.clientEmail);
  }

  const descriptionParts = [
    details.description || `Reunião Estratégica / Diagnóstico Comercial`,
    `----------------------------------------`,
    `Organizador: ${ORGANIZER_EMAIL}`,
  ];

  if (details.clientName) descriptionParts.push(`Cliente/Lead: ${details.clientName}`);
  if (details.clientEmail) descriptionParts.push(`E-mail do Cliente: ${details.clientEmail}`);
  if (details.clientPhone) descriptionParts.push(`WhatsApp / Contato: ${details.clientPhone}`);

  descriptionParts.push(`Link de Videoconferência será gerado via Google Meet no evento.`);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: details.title || `Reunião Estratégica — ${details.clientName || "Cliente"}`,
    dates: datesParam,
    details: descriptionParts.join("\n"),
    location: details.location || "Google Meet (Online)",
    add: attendees.join(","),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera mensagem formatada pronta para enviar no WhatsApp ou E-mail para o cliente
 */
export function generateClientInvitationMessage(details: MeetingDetails, customMeetLink?: string): string {
  const start = new Date(details.startDate);
  const dataFormatada = start.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const horaFormatada = start.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const calendarUrl = generateGoogleCalendarUrl(details);

  return `Olá ${details.clientName || ""}! Tudo bem?

Agendamos a nossa Reunião Estratégica:
📅 Data: ${dataFormatada}
⏰ Horário: ${horaFormatada} (${details.durationMinutes || 45} min)
📍 Local: ${customMeetLink || "Google Meet (Online)"}
👤 Especialista: Lucas (${ORGANIZER_EMAIL})

🔗 Adicionar à sua Google Agenda:
${calendarUrl}

${customMeetLink ? `Link direto da chamada: ${customMeetLink}\n` : ""}Nos falamos em breve! Qualquer imprevisto, só avisar por aqui.`;
}

/**
 * Abre o WhatsApp Web / App com mensagem pré-preenchida
 */
export function openWhatsAppInvite(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}
