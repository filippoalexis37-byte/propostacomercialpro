/**
 * Normalização e validação de números de telefone para WhatsApp Brasil (E.164)
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  // Remove tudo que não for dígito
  const digits = raw.replace(/\D/g, "");
  if (!digits || digits.length < 8) return null;

  // Se já possui DDI 55 e tem tamanho adequado (12 ou 13 dígitos: 55 + DDD + 8/9 dígitos)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem 10 ou 11 dígitos (DDD + número), adiciona o DDI 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Fallback: se começa com 55 retorna dígitos, senão prefixa 55 se tamanho > 9
  if (digits.startsWith("55")) {
    return digits;
  }
  return `55${digits}`;
}

export function formatPhoneDisplay(raw?: string | null): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  // Formato: +55 (11) 99999-9999
  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}
