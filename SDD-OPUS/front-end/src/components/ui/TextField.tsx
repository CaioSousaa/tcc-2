import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const FIELD =
  "block w-full rounded-lg border bg-surface px-[17px] text-base text-ink outline-none focus:border-navy disabled:bg-surface-alt disabled:text-muted";

function borderFor(error?: string) {
  return error ? "border-danger" : "border-line";
}

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  /** Taller input used on the authentication screens. */
  large?: boolean;
}

function Messages({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  return (
    <>
      {hint && !error && <p className="mt-1.5 text-[13px] text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      )}
    </>
  );
}

export function TextField({
  label,
  error,
  hint,
  large = false,
  className = "",
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-body">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD} ${large ? "h-[54px]" : "h-11"} ${borderFor(error)}`}
        {...rest}
      />
      <Messages id={id} error={error} hint={hint} />
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
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-body">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD} py-3 leading-[23px] ${borderFor(error)}`}
        {...rest}
      />
      <Messages id={id} error={error} hint={hint} />
    </div>
  );
}
