interface ColorPickerProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  size?: number;
}

export function ColorPicker({ colors, value, onChange, size = 36 }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => {
        const selected = color.toUpperCase() === value.toUpperCase();
        return (
          <button
            key={color}
            type="button"
            aria-label={`Cor ${color}`}
            aria-pressed={selected}
            onClick={() => onChange(color)}
            className={`flex items-center justify-center rounded-[10px] border-2 ${
              selected ? "border-ink" : "border-transparent"
            }`}
            style={{ width: size, height: size }}
          >
            <span className="rounded-[7px]" style={{ width: size - 6, height: size - 6, backgroundColor: color }} />
          </button>
        );
      })}
    </div>
  );
}
