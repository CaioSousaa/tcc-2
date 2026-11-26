import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "danger-outline" | "ghost" | "dashed";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy font-semibold text-white hover:bg-navy-dark focus-visible:outline-navy",
  secondary: "border border-line bg-surface font-medium text-ink hover:bg-surface-alt focus-visible:outline-navy",
  danger: "bg-danger-dark font-semibold text-white hover:bg-[#8c2722] focus-visible:outline-danger-dark",
  "danger-outline":
    "border border-danger-line bg-surface font-medium text-danger-dark hover:bg-danger-bg focus-visible:outline-danger-dark",
  ghost: "font-medium text-muted hover:bg-chip hover:text-ink focus-visible:outline-navy",
  dashed:
    "border border-dashed border-line-strong bg-transparent font-normal text-muted hover:bg-white/60 focus-visible:outline-navy",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[54px] px-5 text-[15.5px]",
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
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; icon-only buttons have no visible text. */
  label: string;
  size?: number;
  danger?: boolean;
}

/** Square bordered button holding a single icon (pencil, trash, close…). */
export function IconButton({ label, size = 32, danger = false, className = "", type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] border bg-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? "border-danger-line text-danger-dark hover:bg-danger-bg" : "border-line text-muted hover:bg-surface-alt hover:text-ink"
      } ${className}`}
      {...rest}
    />
  );
}
