export const CARD_MIME = "application/x-kanbo-card";
export const LIST_MIME = "application/x-kanbo-list";

export const isDragOf = (event: React.DragEvent, mime: string) =>
  event.dataTransfer.types.includes(mime);

/**
 * Índice de inserção dentro de um container: posição do primeiro elemento cujo
 * centro fica depois do cursor (no eixo informado).
 */
export function dropIndex(
  container: HTMLElement,
  selector: string,
  pointer: number,
  axis: "x" | "y",
): number {
  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
  const index = elements.findIndex((element) => {
    const rect = element.getBoundingClientRect();
    const middle = axis === "y" ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    return pointer < middle;
  });
  return index === -1 ? elements.length : index;
}
