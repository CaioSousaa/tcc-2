import { COLOR_NAMES, SOLID } from "@/lib/colors";

export function ColorPicker<T extends keyof typeof SOLID>({
  colors,
  value,
  onChange,
  size = 32,
}: {
  colors: T[];
  value: T;
  onChange: (color: T) => void;
  size?: number;
}) {
  return (
    <div role="radiogroup" className="flex items-center gap-2.5">
      {colors.map((color) => {
        const selected = color === value;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={COLOR_NAMES[color]}
            title={COLOR_NAMES[color]}
            onClick={() => onChange(color)}
            className={`rounded-[7px] transition ${selected ? "ring-2 ring-ink ring-offset-2" : "hover:scale-105"}`}
            style={{ width: size, height: size, background: SOLID[color] }}
          />
        );
      })}
    </div>
  );
}
