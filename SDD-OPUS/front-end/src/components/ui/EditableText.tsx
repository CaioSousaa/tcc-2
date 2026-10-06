"use client";

import { useState } from "react";

interface EditableTextProps {
  value: string;
  onSave: (next: string) => void;
  label: string;
  maxLength: number;
  disabled?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
  /** Always shows the field border (used for long text such as descriptions). */
  boxed?: boolean;
}

const BOXED =
  "block w-full rounded-lg border border-line bg-surface p-3.5 outline-none focus:border-navy disabled:cursor-default";

const BASE =
  "block w-full rounded-md border border-transparent bg-transparent px-2 py-1 outline-none hover:border-line focus:border-navy focus:bg-surface disabled:cursor-default disabled:hover:border-transparent";

/**
 * Text that is edited in place and saved on blur (or Enter for single-line fields). Escape
 * discards the draft. Callers remount it with a `key` tied to the server value, so a saved
 * change (or a change made by someone else) resets the draft.
 */
export function EditableText({
  value,
  onSave,
  label,
  maxLength,
  disabled = false,
  multiline = false,
  placeholder,
  className = "",
  rows = 4,
  boxed = false,
}: EditableTextProps) {
  const base = boxed ? BOXED : BASE;
  const [draft, setDraft] = useState(value);

  function commit() {
    if (draft.trim() !== value.trim()) onSave(draft);
  }

  if (multiline) {
    return (
      <textarea
        aria-label={label}
        value={draft}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDraft(value);
            event.stopPropagation();
            event.currentTarget.blur();
          }
        }}
        className={`${base} ${className}`}
      />
    );
  }

  return (
    <input
      aria-label={label}
      value={draft}
      maxLength={maxLength}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(value);
          event.stopPropagation();
          event.currentTarget.blur();
        }
      }}
      className={`${base} ${className}`}
    />
  );
}
