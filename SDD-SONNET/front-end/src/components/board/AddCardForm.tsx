"use client";

import { Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import { appendCardInState } from "@/lib/board-state";
import { LIMITS } from "@/lib/constants";
import type { CardSummary } from "@/lib/types";
import { validateText } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { updateBoard, useBoardContext } from "./BoardContext";

export function AddCardForm({ listId }: { listId: string }) {
  const { setData, reload } = useBoardContext();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function close() {
    setOpen(false);
    setTitle("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateText(title, "Título do card", LIMITS.cardTitle.min, LIMITS.cardTitle.max);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await api.post<CardSummary>(`/lists/${listId}/cards`, { title });
      updateBoard(setData, (board) => ({
        ...board,
        lists: appendCardInState(board.lists, response.data),
      }));
      close();
    } catch (cause) {
      const apiError = toApiError(cause);
      if (apiError.status === 404) {
        toast("A lista não existe mais.", "error");
        await reload();
      } else {
        setError(apiError.fieldMessage("title") ?? apiError.message);
      }
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline-soft text-[15.5px] text-muted hover:bg-black/[0.03]"
      >
        <Plus size={14} aria-hidden />
        Adicionar card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-2">
      <textarea
        autoFocus
        rows={2}
        aria-label="Título do card"
        placeholder="Título do card"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        className="block w-full resize-none rounded-lg border border-border bg-surface px-3.5 py-3 text-[15px] text-ink placeholder:text-placeholder focus:outline-2 focus:outline-navy"
      />
      {error ? (
        <p role="alert" className="text-[13px] text-red">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" small loading={pending}>
          Adicionar
        </Button>
        <Button variant="ghost" small onClick={close} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
