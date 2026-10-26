export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  // Remove all non-digit characters
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 0) return null;
  // Ensure country code
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return withCountry;
}
