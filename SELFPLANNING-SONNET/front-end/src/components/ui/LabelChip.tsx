export function LabelChip({
  name,
  color,
  compact = false,
  active = true,
  onClick,
}: {
  name: string;
  color: string;
  compact?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{ backgroundColor: color, opacity: active ? 1 : 0.45 }}
      className={`inline-flex items-center rounded-full font-medium text-white ${
        compact ? "h-4 px-2 text-[10px]" : "h-6 px-2.5 text-xs"
      }`}
    >
      {name}
    </Tag>
  );
}
