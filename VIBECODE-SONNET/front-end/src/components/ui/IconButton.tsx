import type { LucideIcon } from "lucide-react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  size?: number;
  tone?: "default" | "danger";
}

export function IconButton({
  icon: Icon,
  label,
  size = 30,
  tone = "default",
  className = "",
  ...props
}: IconButtonProps) {
  const toneClass =
    tone === "danger"
      ? "border-red-border text-red hover:bg-red-bg"
      : "border-border text-muted hover:bg-surface-alt hover:text-ink";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] border bg-surface transition-colors disabled:opacity-50 ${toneClass} ${className}`}
      style={{ width: size, height: size }}
      {...props}
    >
      <Icon className="size-[13px]" strokeWidth={2.2} />
    </button>
  );
}
