import type { BoardColor, LabelColor } from "./types";

/**
 * Classes estáticas (o Tailwind precisa vê-las por inteiro) para as cores do
 * protótipo. Etiqueta: fundo claro e texto escuro da mesma família.
 */
export const LABEL_STYLES: Record<
  LabelColor,
  { name: string; chip: string; dot: string; swatch: string }
> = {
  red: { name: "Vermelho", chip: "bg-red-bg text-red", dot: "bg-red", swatch: "bg-red" },
  amber: { name: "Âmbar", chip: "bg-amber-bg text-amber-text", dot: "bg-amber", swatch: "bg-amber" },
  green: { name: "Verde", chip: "bg-green-bg text-green", dot: "bg-green", swatch: "bg-green" },
  blue: { name: "Azul", chip: "bg-blue-bg text-blue", dot: "bg-blue", swatch: "bg-blue" },
  purple: { name: "Roxo", chip: "bg-purple-bg text-purple", dot: "bg-purple", swatch: "bg-purple" },
  slate: { name: "Cinza", chip: "bg-slate-bg text-slate", dot: "bg-slate", swatch: "bg-slate" },
};

export const LABEL_COLOR_ORDER: LabelColor[] = ["red", "blue", "green", "amber", "purple", "slate"];

export const BOARD_STYLES: Record<BoardColor, { name: string; band: string }> = {
  navy: { name: "Azul-marinho", band: "bg-navy" },
  blue: { name: "Azul", band: "bg-blue" },
  green: { name: "Verde", band: "bg-green" },
  amber: { name: "Âmbar", band: "bg-amber" },
  purple: { name: "Roxo", band: "bg-purple" },
};

export const BOARD_COLOR_ORDER: BoardColor[] = ["navy", "blue", "green", "amber", "purple"];

const AVATAR_CLASSES = ["bg-blue", "bg-purple", "bg-green", "bg-amber", "bg-slate", "bg-red"];

/** Cor estável por pessoa: o mesmo identificador sempre dá a mesma cor. */
export function avatarClass(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length];
}
