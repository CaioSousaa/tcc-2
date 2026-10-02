import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const FIELD =
  "block w-full rounded-md border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 disabled:bg-slate-100 disabled:text-slate-500";

function ringFor(error?: string) {
  return error ? "ring-red-500" : "ring-slate-300";
}

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  error,
  hint,
  className = "",
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD} ${ringFor(error)}`}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  label,
  error,
  hint,
  className = "",
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD} ${ringFor(error)}`}
        {...rest}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
