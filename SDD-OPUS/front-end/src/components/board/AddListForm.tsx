"use client";

import { Plus } from "lucide-react";
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
        className="flex h-[60px] w-[351px] shrink-0 items-center justify-center gap-2 rounded-[14px] border border-dashed border-line-strong text-base text-muted transition-colors hover:bg-white/60 focus-visible:outline-2 focus-visible:outline-navy"
      >
        <Plus size={15} aria-hidden="true" /> Adicionar lista
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="h-fit w-[351px] shrink-0 space-y-2.5 rounded-[14px] border border-line bg-list p-4"
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
        className="block h-11 w-full rounded-lg border border-line bg-surface px-[17px] text-base text-ink outline-none focus:border-navy"
      />
      {error && (
        <p role="alert" className="text-[13px] text-danger">
          {error.fields.name ?? error.message}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={createList.isPending}>
          Adicionar lista
        </Button>
        <Button variant="secondary" size="sm" onClick={close}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
