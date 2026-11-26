import { Check, ChevronDown } from "lucide-react";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const INPUT =
  "w-full rounded-lg border border-border bg-surface px-[17px] text-base text-ink placeholder:text-placeholder focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15";

const HEIGHTS = { md: "h-11", lg: "h-[54px]" };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-body">{children}</span>;
}

export function Field({
  label,
  error,
  fieldSize = "md",
  className = "",
  wrapperClassName = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  error?: string;
  fieldSize?: "md" | "lg";
  wrapperClassName?: string;
}) {
  return (
    <label className={`block ${wrapperClassName}`}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <input
        {...props}
        className={`${INPUT} ${HEIGHTS[fieldSize]} ${error ? "border-red" : ""} ${className}`}
      />
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
      {label && <FieldLabel>{label}</FieldLabel>}
      <textarea {...props} className={`${INPUT} py-3.5 text-[15px] leading-[23px] ${className}`} />
    </label>
  );
}

export function Select({
  label,
  className = "",
  wrapperClassName = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; wrapperClassName?: string }) {
  return (
    <label className={`block ${wrapperClassName}`}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <span className="relative block">
        <select
          {...props}
          className={`h-11 w-full appearance-none rounded-lg border border-border bg-surface-alt pr-10 pl-4 text-[15.5px] text-ink focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/15 disabled:opacity-60 ${className}`}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink"
        />
      </span>
    </label>
  );
}

export function CheckboxBox({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <span className={`relative inline-flex h-5 w-5 shrink-0 ${className}`}>
      <input
        type="checkbox"
        {...props}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-[#B8BEC9] bg-surface checked:border-navy checked:bg-navy focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:outline-none"
      />
      <Check
        size={14}
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto hidden text-white peer-checked:block"
      />
    </span>
  );
}

export function Checkbox({
  label,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: string }) {
  return (
    <label className={`flex items-center gap-3 text-base text-body ${className}`}>
      <CheckboxBox {...props} />
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
