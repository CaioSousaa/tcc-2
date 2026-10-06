import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] transition-colors disabled:cursor-not-allowed ${
        checked ? "bg-navy text-white" : "border-[1.5px] border-[#B8BEC9] bg-white"
      }`}
    >
      {checked && <Check size={14} strokeWidth={3} />}
    </button>
  );
}
