"use client";

import { useState } from "react";

interface InlineTextProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  editable?: boolean;
  className?: string;
  inputClassName?: string;
  maxLength?: number;
  placeholder?: string;
}

/** Texto que vira campo ao clicar; Enter/blur salva, Esc cancela */
export function InlineText({
  value,
  onSave,
  editable = true,
  className = "",
  inputClassName = "",
  maxLength,
  placeholder,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <span
        role={editable ? "button" : undefined}
        tabIndex={editable ? 0 : undefined}
        onClick={() => {
          if (!editable) return;
          setDraft(value);
          setEditing(true);
        }}
        onKeyDown={(event) => {
          if (editable && event.key === "Enter") {
            setDraft(value);
            setEditing(true);
          }
        }}
        className={`${editable ? "cursor-text rounded hover:bg-surface-alt" : ""} ${className}`}
      >
        {value}
      </span>
    );
  }

  async function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) await onSave(next);
  }

  return (
    <input
      autoFocus
      value={draft}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={`w-full rounded-md border border-navy bg-white px-2 py-0.5 outline-none ${inputClassName}`}
    />
  );
}
