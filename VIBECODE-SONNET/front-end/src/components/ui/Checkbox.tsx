import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled, className = "" }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "border-navy bg-navy" : "border-checkbox bg-surface hover:border-muted"
      } ${className}`}
    >
      {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
    </button>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex size-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] bg-surface ${
        checked ? "border-navy" : "border-checkbox"
      }`}
    >
      {checked && <span className="size-[9px] rounded-full bg-navy" />}
    </span>
  );
}
