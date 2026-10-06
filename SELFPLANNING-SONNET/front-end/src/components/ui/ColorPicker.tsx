export function ColorPicker({
  colors,
  value,
  onChange,
  size = "md",
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  size?: "sm" | "md";
}) {
  const outer = size === "md" ? "h-9 w-9 rounded-[10px]" : "h-[30px] w-[30px] rounded-lg";
  const inner = size === "md" ? "h-[30px] w-[30px] rounded-[7px]" : "h-[26px] w-[26px] rounded-md";
  return (
    <div className={`flex ${size === "md" ? "gap-2" : "gap-1.5 pt-1"}`}>
      {colors.map((c) => {
        const selected = value.toUpperCase() === c.toUpperCase();
        return (
          <button
            key={c}
            type="button"
            aria-label={c}
            aria-pressed={selected}
            onClick={() => onChange(c)}
            className={`flex items-center justify-center border ${outer} ${
              selected ? "border-ink" : "border-transparent"
            }`}
          >
            <span className={inner} style={{ backgroundColor: c }} />
          </button>
        );
      })}
    </div>
  );
}
