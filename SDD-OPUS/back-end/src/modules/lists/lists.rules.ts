export type ListDeletionDecision =
  | { ok: true }
  | { ok: false; cardCount: number };

/**
 * RF05 / RN-X2: a list may only be deleted when the user confirmed exactly the number of cards
 * it really holds (omitted confirmation = 0). The count is measured inside the transaction with
 * the board locked, so a card added meanwhile makes the confirmation stale and nothing is deleted.
 */
export function decideListDeletion(actualCardCount: number, confirmedCards: number): ListDeletionDecision {
  if (actualCardCount === confirmedCards) return { ok: true };
  return { ok: false, cardCount: actualCardCount };
}
