export interface PaletteColor {
  key: string;
  name: string;
  color: string;
  bg: string;
  text: string;
}

/** Paleta de etiquetas do protótipo (cor base, fundo e texto do chip). */
export const LABEL_COLORS: PaletteColor[] = [
  { key: "red", name: "Vermelho", color: "#C8423A", bg: "#FBE9E7", text: "#C8423A" },
  { key: "blue", name: "Azul", color: "#2F6FB5", bg: "#E6EFF9", text: "#2F6FB5" },
  { key: "green", name: "Verde", color: "#2A8F6A", bg: "#E3F3EC", text: "#2A8F6A" },
  { key: "amber", name: "Âmbar", color: "#C98A1A", bg: "#FBF0D9", text: "#9A6A0C" },
  { key: "purple", name: "Roxo", color: "#7B5CBD", bg: "#EFE9F8", text: "#7B5CBD" },
  { key: "slate", name: "Cinza", color: "#6B7A8C", bg: "#EDEFF2", text: "#4F5B69" },
];

/** Cores disponíveis para quadros no modal "Novo quadro". */
export const BOARD_COLORS = ["#1D3557", "#2F6FB5", "#2A8F6A", "#C98A1A", "#7B5CBD"];

export function labelStyle(color: string) {
  const match = LABEL_COLORS.find(
    (c) => c.color.toLowerCase() === color.toLowerCase(),
  );
  if (match) return { backgroundColor: match.bg, color: match.text };
  return { backgroundColor: `${color}22`, color };
}

const AVATAR_COLORS = ["#2F6FB5", "#7B5CBD", "#2A8F6A", "#C98A1A", "#C8423A", "#1D3557", "#6B7A8C"];

export function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
