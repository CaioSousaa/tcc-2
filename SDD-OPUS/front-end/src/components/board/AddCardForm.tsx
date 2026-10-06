"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { parseApiError } from "@/lib/api";
import { useCreateCard } from "@/lib/board";

interface AddCardFormProps {
  boardId: string;
  listId: string;
  /** Called after a card was created; lets the board warn when a view filter may hide it (B31). */
  onCreated?: () => void;
}

export function AddCardForm({ boardId, listId, onCreated }: AddCardFormProps) {
  const createCard = useCreateCard(boardId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const error = createCard.isError ? parseApiError(createCard.error) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    createCard.mutate(
      { listId, title },
      {
        onSuccess: () => {
          setTitle("");
          onCreated?.();
        },
      },
    );
  }

  function close() {
    setOpen(false);
    setTitle("");
    createCard.reset();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-[15.5px] text-muted transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-navy"
      >
        <Plus size={14} aria-hidden="true" /> Adicionar card
      </button>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <textarea
        aria-label="Título do card"
        autoFocus
        rows={2}
        value={title}
        maxLength={200}
        placeholder="Título do card"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
          if (event.key === "Escape") close();
        }}
        className="block w-full resize-none rounded-[10px] border border-line bg-surface p-3 text-[15.5px] text-ink outline-none focus:border-navy"
      />
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error.fields.title ?? error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={createCard.isPending}>
          Adicionar
        </Button>
        <Button variant="secondary" size="sm" onClick={close}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
