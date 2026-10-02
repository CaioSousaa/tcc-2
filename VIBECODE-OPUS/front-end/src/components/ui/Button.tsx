import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "danger-outline" | "ghost";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white font-semibold hover:bg-[#162a45]",
  secondary:
    "bg-surface text-ink font-medium border border-border hover:bg-surface-alt",
  danger: "bg-red-dark text-white font-semibold hover:bg-[#8c2722]",
  "danger-outline":
    "bg-surface text-red-dark font-medium border border-[#F1C9C5] hover:bg-red-bg",
  ghost: "text-muted hover:text-ink hover:bg-surface-alt",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-[14px]",
  sm: "h-9 px-3.5 text-[14px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <LoaderCircle size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
}

/** Small square bordered button used for edit/delete actions. */
export function IconButton({
  label,
  size = 30,
  className = "",
  children,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] border border-border bg-surface text-muted transition-colors hover:bg-surface-alt hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
