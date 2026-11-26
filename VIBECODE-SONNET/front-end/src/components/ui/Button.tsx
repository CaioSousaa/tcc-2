import { forwardRef } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white font-semibold hover:bg-navy-hover",
  secondary: "bg-surface text-ink font-medium border border-border hover:bg-surface-alt",
  danger: "bg-red-dark text-white font-semibold hover:bg-[#8c2722]",
  ghost: "bg-transparent text-muted hover:bg-surface-alt",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[14.5px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[54px] px-5 text-[15.5px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, disabled, className = "", children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {loading && <LoaderCircle className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
