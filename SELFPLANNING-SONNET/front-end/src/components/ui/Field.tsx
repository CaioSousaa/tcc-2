import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const INPUT =
  "w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-placeholder focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

export function Field({
  label,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <input {...props} className={`${INPUT} h-10 ${error ? "border-red" : ""} ${className}`} />
      {error && <span className="mt-1 block text-xs text-red">{error}</span>}
    </label>
  );
}

export function TextArea({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <textarea {...props} className={`${INPUT} py-2 ${className}`} />
    </label>
  );
}

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <select {...props} className={`${INPUT} h-10 ${className}`}>
        {children}
      </select>
    </label>
  );
}

export function Checkbox({
  label,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }) {
  return (
    <label className={`flex items-center gap-2 text-sm text-body ${className}`}>
      <input
        type="checkbox"
        {...props}
        className="h-4 w-4 rounded border-border accent-navy"
      />
      {label}
    </label>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark" role="alert">
      {message}
    </p>
  );
}
