// Fixed label palette (plan §3.3). The database stores the key only.
export const LABEL_COLORS = [
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

export type LabelColor = (typeof LABEL_COLORS)[number];

export function isLabelColor(value: unknown): value is LabelColor {
  return typeof value === "string" && (LABEL_COLORS as readonly string[]).includes(value);
}
