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
}

const BASE =
  "block w-full rounded-md border-0 bg-transparent px-2 py-1 ring-1 ring-inset ring-transparent hover:ring-slate-300 focus:bg-white focus:ring-2 focus:ring-indigo-600 disabled:cursor-default disabled:hover:ring-transparent";

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
}: EditableTextProps) {
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
        className={`${BASE} ${className}`}
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
      className={`${BASE} ${className}`}
    />
  );
}
