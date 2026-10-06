import type { BoardSummary } from "./types";

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Resumo do quadro na lista: `5 listas · 11 cards · 2 atrasados` (atrasados só se houver). */
export function boardSummaryText(
  board: Pick<BoardSummary, "listCount" | "cardCount" | "overdueCount">,
): string {
  const parts = [
    plural(board.listCount, "lista", "listas"),
    plural(board.cardCount, "card", "cards"),
  ];
  if (board.overdueCount > 0) parts.push(plural(board.overdueCount, "atrasado", "atrasados"));
  return parts.join(" · ");
}

/** Subtítulo da página de quadros: `4 quadros · você é administrador em 3`. */
export function boardsSubtitle(boards: Pick<BoardSummary, "role">[]): string {
  const admin = boards.filter((board) => board.role === "admin").length;
  const base = plural(boards.length, "quadro", "quadros");
  return admin > 0 ? `${base} · você é administrador em ${admin}` : base;
}

/** "N cards no quadro" da barra de filtros. */
export function cardsInBoardText(count: number): string {
  return `${plural(count, "card", "cards")} no quadro`;
}
