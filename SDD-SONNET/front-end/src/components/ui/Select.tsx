import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

export function Select({
  label,
  id,
  className = "",
  wrapperClassName = "",
  compact = false,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label?: string;
  wrapperClassName?: string;
  /** Altura 38/40px em vez de 44px. */
  compact?: boolean;
}) {
  return (
    <div className={`space-y-2 ${wrapperClassName}`}>
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-body">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          id={id}
          className={`block w-full appearance-none rounded-lg border border-border bg-surface-alt pl-4 pr-10 text-[15px] text-ink focus:outline-2 focus:outline-navy disabled:opacity-60 ${
            compact ? "h-10" : "h-11"
          } ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink"
        />
      </div>
    </div>
  );
}
