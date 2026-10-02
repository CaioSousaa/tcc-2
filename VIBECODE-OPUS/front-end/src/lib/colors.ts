import type { BoardColor, LabelColor } from "./types";

export const BOARD_COLORS: BoardColor[] = [
  "navy",
  "blue",
  "green",
  "amber",
  "purple",
];

export const LABEL_COLORS: LabelColor[] = [
  "red",
  "blue",
  "green",
  "amber",
  "purple",
  "slate",
];

/** Solid swatch color (stripes, dots, avatars). */
export const SOLID: Record<BoardColor | LabelColor, string> = {
  navy: "var(--navy)",
  blue: "var(--blue)",
  green: "var(--green)",
  amber: "var(--amber)",
  purple: "var(--purple)",
  red: "var(--red)",
  slate: "var(--slate)",
};

/** Soft background + readable text used by label chips. */
export const LABEL_STYLE: Record<LabelColor, { bg: string; text: string }> = {
  red: { bg: "var(--red-bg)", text: "var(--red)" },
  blue: { bg: "var(--blue-bg)", text: "var(--blue)" },
  green: { bg: "var(--green-bg)", text: "var(--green)" },
  amber: { bg: "var(--amber-bg)", text: "var(--amber-text)" },
  purple: { bg: "var(--purple-bg)", text: "var(--purple)" },
  slate: { bg: "var(--slate-bg)", text: "var(--slate)" },
};

export const COLOR_NAMES: Record<BoardColor | LabelColor, string> = {
  navy: "Azul-marinho",
  blue: "Azul",
  green: "Verde",
  amber: "Âmbar",
  purple: "Roxo",
  red: "Vermelho",
  slate: "Cinza",
};

const AVATAR_COLORS = [
  "var(--blue)",
  "var(--purple)",
  "var(--green)",
  "var(--amber)",
  "var(--red)",
  "var(--slate)",
];

/** Stable avatar color derived from the user id. */
export function avatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
