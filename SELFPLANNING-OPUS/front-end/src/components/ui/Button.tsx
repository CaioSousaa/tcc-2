import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white font-semibold hover:bg-navy-hover",
  secondary: "bg-white text-ink font-medium border border-border hover:bg-surface-alt",
  danger: "bg-red-dark text-white font-semibold hover:bg-red",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  compact?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  compact = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "h-9 px-4" : "h-11 px-5"
      } ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? "Aguarde…" : children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: number;
  danger?: boolean;
}

export function IconButton({
  label,
  size = 30,
  danger = false,
  className = "",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-red-border text-red hover:bg-red-bg"
          : "border-border text-muted hover:bg-surface-alt hover:text-ink"
      } ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      {children}
    </button>
  );
}
