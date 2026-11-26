import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const BASE =
  "block w-full rounded-lg border bg-surface text-ink placeholder:text-placeholder focus:outline-2 focus:outline-offset-0 focus:outline-navy disabled:bg-surface-alt";

interface FieldProps {
  label?: string;
  error?: string | null;
  hint?: string;
  /** Campo alto (54px) dos formulários de entrada; o padrão tem 44px. */
  tall?: boolean;
}

export function Field({
  label,
  error,
  hint,
  tall = false,
  id,
  className = "",
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-body">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${BASE} px-[17px] ${tall ? "h-[54px] text-base" : "h-11 text-[15px]"} ${
          error ? "border-red" : "border-border"
        } ${className}`}
        {...rest}
      />
      {hint && !error ? <p className="text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  error,
  id,
  className = "",
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <div className="space-y-2">
      {label ? (
        <label htmlFor={id} className="block text-[13.5px] font-medium text-body">
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${BASE} px-3.5 py-3 text-[15px] leading-normal ${error ? "border-red" : "border-border"} ${className}`}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
