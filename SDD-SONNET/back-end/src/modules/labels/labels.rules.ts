/** Chave de unicidade do nome: sem espaços nas pontas e sem diferenciar caixa (RN-26, CA-59). */
export function labelNameKey(name: string): string {
  return name.trim().toLowerCase();
}
