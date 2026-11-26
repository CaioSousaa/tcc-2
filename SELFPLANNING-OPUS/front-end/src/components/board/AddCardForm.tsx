"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";

export function AddCardForm({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const value = title.trim();
    if (!value) return;
    setSaving(true);
    try {
      await onAdd(value);
      setTitle("");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-[15.5px] text-muted transition-colors hover:bg-white"
      >
        <Plus size={14} /> Adicionar card
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        autoFocus
        rows={2}
        maxLength={200}
        value={title}
        placeholder="Título do card"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
          if (event.key === "Escape") setOpen(false);
        }}
        className="w-full resize-none rounded-[10px] border border-border bg-white p-3 text-[15px] text-ink outline-none focus:border-navy"
      />
      <div className="flex items-center gap-2">
        <Button compact loading={saving} onClick={submit}>
          Adicionar
        </Button>
        <IconButton label="Cancelar" size={36} onClick={() => setOpen(false)}>
          <X size={14} />
        </IconButton>
      </div>
    </div>
  );
}
