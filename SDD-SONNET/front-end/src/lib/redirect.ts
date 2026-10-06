/**
 * Aceita apenas caminhos internos (começam com `/`, não com `//` nem `/\`).
 * Qualquer outro valor cai no destino padrão (evita redirecionamento aberto, RT-13).
 */
export function safeNextPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;
  return value;
}
