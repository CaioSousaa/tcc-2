"use client";

import { X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EditableText } from "@/components/ui/EditableText";
import { errorMessage } from "@/lib/api";
import {
  useCreateChecklist,
  useCreateItem,
  useDeleteChecklist,
  useDeleteItem,
  useRenameChecklist,
  useUpdateItem,
} from "@/lib/card";
import { progressPercent, progressText } from "@/lib/progress";
import type { Checklist } from "@/lib/types";

function ProgressBar({ checked, total }: { checked: number; total: number }) {
  const percent = progressPercent(checked, total);
  return (
    <div className="flex items-center gap-3 font-mono text-[12.5px] text-muted">
      <span data-testid="progress-text" className="shrink-0">
        {progressText(checked, total)}
      </span>
      {percent !== null && (
        <>
          <span className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-track" aria-hidden="true">
            <span className="block h-full rounded-[3px] bg-success transition-all" style={{ width: `${percent}%` }} />
          </span>
          <span data-testid="progress-percent" className="w-10 text-right">
            {percent}%
          </span>
        </>
      )}
    </div>
  );
}

function AddItemForm({ boardId, cardId, checklistId }: { boardId: string; cardId: string; checklistId: string }) {
  const createItem = useCreateItem(boardId, cardId);
  const [text, setText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    createItem.mutate({ checklistId, text }, { onSuccess: () => setText("") });
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 flex flex-wrap items-center gap-2">
      <input
        aria-label="Novo item"
        value={text}
        maxLength={200}
        placeholder="+ Adicionar item"
        onChange={(event) => setText(event.target.value)}
        className="h-9 min-w-0 flex-1 rounded-md border border-dashed border-line-strong bg-transparent px-[13px] text-sm text-ink outline-none placeholder:text-muted focus:border-solid focus:border-navy focus:bg-surface"
      />
      <Button type="submit" size="sm" variant="secondary" loading={createItem.isPending}>
        Adicionar
      </Button>
      {createItem.isError && (
        <span role="alert" className="w-full text-[13px] text-danger">
          {errorMessage(createItem.error)}
        </span>
      )}
    </form>
  );
}

interface ChecklistSectionProps {
  boardId: string;
  cardId: string;
  checklists: Checklist[];
  checked: number;
  total: number;
  canEdit: boolean;
}

/** Checklists of a card with per-checklist and overall progress (CK1–CK4). */
export function ChecklistSection({ boardId, cardId, checklists, checked, total, canEdit }: ChecklistSectionProps) {
  const createChecklist = useCreateChecklist(boardId, cardId);
  const renameChecklist = useRenameChecklist(boardId, cardId);
  const deleteChecklist = useDeleteChecklist(boardId, cardId);
  const updateItem = useUpdateItem(boardId, cardId);
  const deleteItem = useDeleteItem(boardId, cardId);

  const [title, setTitle] = useState("");

  const error = [createChecklist, renameChecklist, deleteChecklist, updateItem, deleteItem].find(
    (mutation) => mutation.isError,
  );

  function addChecklist(event: FormEvent) {
    event.preventDefault();
    createChecklist.mutate(title, { onSuccess: () => setTitle("") });
  }

  return (
    <section aria-labelledby="checklists-heading" className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 id="checklists-heading" className="text-[13.5px] font-medium text-body">
          Checklists
        </h3>
        <div className="w-56">
          <ProgressBar checked={checked} total={total} />
        </div>
      </div>

      {error && <Alert>{errorMessage(error.error)}</Alert>}

      {checklists.map((checklist) => {
        const done = checklist.items.filter((item) => item.checked).length;
        return (
          <div key={checklist.id} className="rounded-[10px] border border-line bg-surface p-4">
            <div className="mb-2 flex items-center gap-2">
              <EditableText
                key={checklist.title}
                label="Título da checklist"
                value={checklist.title}
                maxLength={100}
                disabled={!canEdit}
                className="text-[15px] font-semibold text-ink"
                onSave={(next) => renameChecklist.mutate({ checklistId: checklist.id, title: next })}
              />
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Excluir checklist ${checklist.title}`}
                  onClick={() => deleteChecklist.mutate(checklist.id)}
                >
                  Excluir
                </Button>
              )}
            </div>
            <ProgressBar checked={done} total={checklist.items.length} />

            <ul className="mt-3 flex flex-col gap-1.5">
              {checklist.items.map((item) => (
                <li key={item.id} className="group flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label={`Marcar ${item.text}`}
                    checked={item.checked}
                    disabled={!canEdit}
                    onChange={(event) => updateItem.mutate({ itemId: item.id, checked: event.target.checked })}
                    className="ml-2 size-5 shrink-0 rounded-[5px] accent-navy"
                  />
                  <EditableText
                    key={item.text}
                    label="Texto do item"
                    value={item.text}
                    maxLength={200}
                    disabled={!canEdit}
                    className={`text-[15.5px] ${item.checked ? "text-hint line-through" : "text-ink"}`}
                    onSave={(next) => updateItem.mutate({ itemId: item.id, text: next })}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Excluir item ${item.text}`}
                      onClick={() => deleteItem.mutate(item.id)}
                      className="rounded p-1 text-hint opacity-60 group-hover:opacity-100 hover:bg-danger-bg hover:text-danger focus-visible:opacity-100"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {canEdit && <AddItemForm boardId={boardId} cardId={cardId} checklistId={checklist.id} />}
          </div>
        );
      })}

      {checklists.length === 0 && <p className="text-[14px] text-muted">Este card ainda não tem checklists.</p>}

      {canEdit && (
        <form onSubmit={addChecklist} noValidate className="flex gap-2">
          <input
            aria-label="Título da nova checklist"
            value={title}
            maxLength={100}
            placeholder="Nova checklist"
            onChange={(event) => setTitle(event.target.value)}
            className="h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-navy"
          />
          <Button type="submit" size="sm" variant="secondary" loading={createChecklist.isPending}>
            Adicionar checklist
          </Button>
        </form>
      )}
    </section>
  );
}
