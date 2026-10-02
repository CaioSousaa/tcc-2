import type { Progress } from "./types";

/**
 * Percentual do progresso, arredondado ao inteiro mais próximo (metades para
 * cima). Sem itens não há progresso: devolve `null` (RN-20, CB-24).
 */
export function progressPercent(progress: Progress): number | null {
  if (progress.total <= 0) return null;
  return Math.round((progress.done / progress.total) * 100);
}
