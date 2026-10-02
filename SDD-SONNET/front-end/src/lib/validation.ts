/** Conta caracteres por pontos de código Unicode, como o back-end (RT-33). */
export function charCount(value: string): number {
  let count = 0;
  for (const _char of value) count += 1;
  return count;
}

/** Valida texto obrigatório após `trim`. Devolve a mensagem de erro ou `null`. */
export function validateText(
  value: string,
  label: string,
  min: number,
  max: number,
): string | null {
  const length = charCount(value.trim());
  if (length < min) {
    return min <= 1
      ? `${label} é obrigatório.`
      : `${label} deve ter no mínimo ${min} caracteres.`;
  }
  if (length > max) return `${label} deve ter no máximo ${max} caracteres.`;
  return null;
}

export function validateEmail(value: string, label = "E-mail"): string | null {
  const email = value.trim();
  if (email.length === 0) return `${label} é obrigatório.`;
  if (charCount(email) > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Informe um e-mail válido.";
  }
  return null;
}
