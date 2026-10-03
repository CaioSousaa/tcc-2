import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy/90",
  secondary: "border border-border bg-surface text-ink hover:bg-surface-alt",
  danger: "bg-red text-white hover:bg-red-dark",
  ghost: "text-body hover:bg-black/5",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function IconButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-black/5 hover:text-ink disabled:opacity-50 ${className}`}
    />
  );
}
