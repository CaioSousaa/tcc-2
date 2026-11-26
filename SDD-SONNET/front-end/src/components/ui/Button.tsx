import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy/90 focus-visible:outline-navy",
  secondary:
    "border border-border bg-surface font-medium text-ink hover:bg-surface-alt focus-visible:outline-navy",
  danger: "bg-red-dark text-white hover:bg-red-dark/90 focus-visible:outline-red-dark",
  ghost: "font-medium text-muted hover:bg-black/5 focus-visible:outline-navy",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  /** Altura menor (36px) para ações dentro de blocos. */
  small?: boolean;
  /** Altura maior (54px) dos formulários de entrada. */
  large?: boolean;
  icon?: LucideIcon;
  children?: ReactNode;
}

/** Botão desabilitado enquanto `loading`, para impedir envio duplicado (RT-20). */
export function Button({
  variant = "primary",
  loading = false,
  small = false,
  large = false,
  icon: Icon,
  className = "",
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const size = large ? "h-[54px] px-5 text-[15.5px]" : small ? "h-9 px-4 text-sm" : "h-11 px-5 text-[15px]";
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${size} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Spinner /> : Icon ? <Icon size={15} aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Botão quadrado só com ícone (editar, excluir, fechar). */
export function IconButton({
  icon: Icon,
  label,
  size = 30,
  danger = false,
  className = "",
  type = "button",
  ...rest
}: {
  icon: LucideIcon;
  label: string;
  size?: number;
  danger?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] border bg-surface transition-colors hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? "border-danger-line text-red" : "border-border text-muted"
      } ${className}`}
      {...rest}
    >
      <Icon size={13} aria-hidden />
    </button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}
