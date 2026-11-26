import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy px-5 font-semibold text-white hover:bg-navy/90",
  secondary: "border border-border bg-surface px-[17px] font-medium text-ink hover:bg-surface-alt",
  danger: "bg-red-dark px-[17px] font-semibold text-white hover:bg-red-dark/90",
  ghost: "px-[17px] font-medium text-body hover:bg-black/5",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 text-sm",
  md: "h-11 text-[15px]",
  lg: "h-[54px] text-[15.5px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function IconButton({
  className = "",
  size = 30,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: 29 | 30 | 32 }) {
  return (
    <button
      type="button"
      {...props}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] border border-border bg-surface text-muted transition-colors hover:bg-surface-alt hover:text-ink disabled:opacity-50 ${className}`}
    />
  );
}
