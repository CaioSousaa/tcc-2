interface ColorSwatchesProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  size?: "sm" | "md";
}

export function ColorSwatches({ colors, value, onChange, size = "md" }: ColorSwatchesProps) {
  const outer = size === "md" ? "size-9 rounded-[10px]" : "size-[30px] rounded-lg";
  const inner = size === "md" ? "size-[30px] rounded-[7px]" : "size-[26px] rounded-md";
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const selected = color.toLowerCase() === value.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            aria-label={`Cor ${color}`}
            aria-pressed={selected}
            onClick={() => onChange(color)}
            className={`flex items-center justify-center border-2 ${outer}`}
            style={{ borderColor: selected ? (size === "md" ? "#1A1F2C" : color) : "transparent" }}
          >
            <span className={inner} style={{ backgroundColor: color }} />
          </button>
        );
      })}
    </div>
  );
}
