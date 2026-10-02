"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { parseApiError } from "@/lib/api";
import { useCreateList } from "@/lib/board";

export function AddListForm({ boardId }: { boardId: string }) {
  const createList = useCreateList(boardId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const error = createList.isError ? parseApiError(createList.error) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    createList.mutate(name, { onSuccess: () => setName("") });
  }

  function close() {
    setOpen(false);
    setName("");
    createList.reset();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-fit w-72 shrink-0 rounded-xl bg-white/60 px-3 py-2.5 text-left text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-white focus-visible:outline-2 focus-visible:outline-indigo-600"
      >
        + Adicionar lista
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="h-fit w-72 shrink-0 space-y-2 rounded-xl bg-slate-100 p-2 ring-1 ring-slate-200"
    >
      <input
        aria-label="Nome da lista"
        autoFocus
        value={name}
        maxLength={100}
        placeholder="Nome da lista"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
        className="block w-full rounded-lg border-0 bg-white px-2 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
      />
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error.fields.name ?? error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={createList.isPending}>
          Adicionar lista
        </Button>
        <Button variant="ghost" size="sm" onClick={close}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
