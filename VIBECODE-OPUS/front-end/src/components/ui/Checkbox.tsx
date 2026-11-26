import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onChange,
  disabled,
  label,
  ariaLabel,
  className = "",
}: CheckboxProps) {
  return (
    <label
      className={`inline-flex items-center gap-3 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className}`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-[5px] transition peer-focus-visible:ring-2 peer-focus-visible:ring-navy/30 ${
          checked ? "bg-navy" : "border-[1.5px] border-[#B8BEC9] bg-surface"
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} className="text-white" />}
      </span>
      {label}
    </label>
  );
}
