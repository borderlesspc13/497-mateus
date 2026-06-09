export function digitsOnly(telefone: string): string {
  return telefone.replace(/\D/g, "");
}

export function formatPhoneForWhatsApp(telefone: string | null | undefined): string | null {
  if (!telefone?.trim()) return null;

  let digits = digitsOnly(telefone);
  if (!digits) return null;

  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  if (digits.length < 10) return null;

  if (!digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }

  return digits.length >= 12 ? digits : null;
}
