import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

export const inputClass =
  "h-11 w-full rounded-lg border border-border bg-white px-4 text-[15px] text-ink outline-none transition-colors focus:border-navy";

export const selectClass =
  "h-11 w-full rounded-lg border border-border bg-surface-alt px-4 text-[15px] text-ink outline-none focus:border-navy";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, id, className = "", ...props }: FieldProps) {
  const inputId = id ?? props.name;
  return (
    <label htmlFor={inputId} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-body">{label}</span>
      <input id={inputId} className={`${inputClass} ${className}`} {...props} />
    </label>
  );
}

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${selectClass} ${className}`} {...props} />;
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-bg px-3.5 py-2.5 text-sm text-red">
      {message}
    </p>
  );
}
