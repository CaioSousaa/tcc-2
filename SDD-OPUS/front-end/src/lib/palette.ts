// Label colors: the API stores palette KEYS (back-end shared/palette); the visuals live here.
// Class names are written out in full so Tailwind can see them.

export const LABEL_COLOR_KEYS = [
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "blue",
  "indigo",
  "purple",
  "pink",
  "gray",
] as const;

export type LabelColorKey = (typeof LABEL_COLOR_KEYS)[number];

interface LabelStyle {
  /** Solid swatch. */
  swatch: string;
  /** Chip: soft background + readable text. */
  chip: string;
  name: string;
}

export const LABEL_STYLES: Record<LabelColorKey, LabelStyle> = {
  red: { swatch: "bg-red-500", chip: "bg-red-100 text-red-800", name: "Vermelho" },
  orange: { swatch: "bg-orange-500", chip: "bg-orange-100 text-orange-800", name: "Laranja" },
  yellow: { swatch: "bg-yellow-400", chip: "bg-yellow-100 text-yellow-900", name: "Amarelo" },
  green: { swatch: "bg-green-500", chip: "bg-green-100 text-green-800", name: "Verde" },
  teal: { swatch: "bg-teal-500", chip: "bg-teal-100 text-teal-800", name: "Turquesa" },
  blue: { swatch: "bg-blue-500", chip: "bg-blue-100 text-blue-800", name: "Azul" },
  indigo: { swatch: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-800", name: "Índigo" },
  purple: { swatch: "bg-purple-500", chip: "bg-purple-100 text-purple-800", name: "Roxo" },
  pink: { swatch: "bg-pink-500", chip: "bg-pink-100 text-pink-800", name: "Rosa" },
  gray: { swatch: "bg-slate-500", chip: "bg-slate-200 text-slate-800", name: "Cinza" },
};

export function labelStyle(color: string): LabelStyle {
  return LABEL_STYLES[color as LabelColorKey] ?? LABEL_STYLES.gray;
}

const BOARD_COLORS = ["#1D3557", "#2A8F6A", "#7B5CBD", "#C98A1A", "#2F6FB5"];

/** Accent stripe of a board card. Boards have no stored color, so it is derived from the id. */
export function boardColor(boardId: string): string {
  let hash = 0;
  for (const char of boardId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return BOARD_COLORS[hash % BOARD_COLORS.length];
}
