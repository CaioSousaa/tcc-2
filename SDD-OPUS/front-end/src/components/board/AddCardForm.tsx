"use client";

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
        className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-slate-600 hover:bg-slate-200/70 focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        + Adicionar card
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
        className="block w-full resize-none rounded-lg border-0 bg-white p-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
      />
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error.fields.title ?? error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={createCard.isPending}>
          Adicionar
        </Button>
        <Button variant="ghost" size="sm" onClick={close}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
