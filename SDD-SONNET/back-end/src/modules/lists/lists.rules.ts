export type DeleteStrategy = "delete" | "move";

export type ListDeletionDecision =
  | { kind: "delete" }
  | { kind: "move"; targetListId: string }
  | { kind: "needs_choice"; cardCount: number }
  | { kind: "invalid_target" };

/**
 * Decide o que fazer ao excluir uma lista (RF-14, RN-16, CA-21 a CA-26).
 * - Lista vazia: exclui direto, ignorando a estratégia.
 * - Com cards e sem escolha explícita: recusa, nada é descartado.
 * - Mover: o destino precisa ser outra lista do mesmo quadro.
 */
export function decideListDeletion(input: {
  cardCount: number;
  strategy?: DeleteStrategy;
  targetListId?: string;
  /** Demais listas do mesmo quadro (exclui a lista que será removida). */
  otherListIds: readonly string[];
}): ListDeletionDecision {
  if (input.cardCount === 0) return { kind: "delete" };
  if (input.strategy === undefined) {
    return { kind: "needs_choice", cardCount: input.cardCount };
  }
  if (input.strategy === "delete") return { kind: "delete" };
  if (input.targetListId !== undefined && input.otherListIds.includes(input.targetListId)) {
    return { kind: "move", targetListId: input.targetListId };
  }
  return { kind: "invalid_target" };
}
