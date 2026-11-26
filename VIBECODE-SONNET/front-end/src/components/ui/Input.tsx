import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = "md", className = "", ...props },
  ref,
) {
  const size = inputSize === "lg" ? "h-[54px] text-base" : "h-11 text-[15.5px]";
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-border bg-surface px-[17px] text-ink outline-none transition-colors placeholder:text-placeholder focus:border-navy focus:ring-2 focus:ring-navy/10 ${size} ${className}`}
      {...props}
    />
  );
});

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-y rounded-lg border border-border bg-surface p-[14px] text-[15px] leading-[1.5] text-ink outline-none transition-colors placeholder:text-placeholder focus:border-navy focus:ring-2 focus:ring-navy/10 ${className}`}
      {...props}
    />
  );
}

export function FieldLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-body">
      {children}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
      {error && <p className="text-[13px] text-red">{error}</p>}
    </div>
  );
}
