const TEXT_OVERRIDES: Record<string, string> = {
  "#C98A1A": "#9A6A0C",
};

export function labelColors(color: string) {
  const key = color.toUpperCase();
  return {
    background: `color-mix(in srgb, ${color} 12%, white)`,
    text: TEXT_OVERRIDES[key] ?? color,
  };
}

export function LabelChip({
  name,
  color,
  size = "md",
}: {
  name: string;
  color: string;
  size?: "md" | "lg";
}) {
  const { background, text } = labelColors(color);
  return (
    <span
      style={{ backgroundColor: background, color: text }}
      className={`inline-flex items-center rounded-md px-[9px] py-[3px] font-medium ${
        size === "lg" ? "text-[13.5px]" : "text-[12.5px]"
      }`}
    >
      {name}
    </span>
  );
}
