import { Check } from "lucide-react";

/** Caixa de seleção do protótipo: 20px, marcada em azul-marinho. */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex h-5 w-5 shrink-0 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className={`flex h-5 w-5 items-center justify-center rounded-[5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy peer-disabled:opacity-60 ${
          checked ? "bg-navy" : "border-[1.5px] border-check-border bg-surface"
        }`}
      >
        {checked ? <Check size={14} className="text-white" strokeWidth={3} /> : null}
      </span>
    </span>
  );
}
