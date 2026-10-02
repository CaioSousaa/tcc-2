"use client";

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
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <span data-testid="progress-text" className="w-16 shrink-0">
        {progressText(checked, total)}
      </span>
      {percent !== null && (
        <>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200" aria-hidden="true">
            <span className="block h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
          </span>
          <span data-testid="progress-percent" className="w-9 text-right">
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
    <form onSubmit={submit} noValidate className="mt-2 flex gap-2">
      <input
        aria-label="Novo item"
        value={text}
        maxLength={200}
        placeholder="Adicionar item"
        onChange={(event) => setText(event.target.value)}
        className="min-w-0 flex-1 rounded-md border-0 bg-white px-2 py-1 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
      />
      <Button type="submit" size="sm" variant="secondary" loading={createItem.isPending}>
        Adicionar
      </Button>
      {createItem.isError && (
        <span role="alert" className="self-center text-xs text-red-600">
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
    <section aria-labelledby="checklists-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 id="checklists-heading" className="text-sm font-semibold text-slate-800">
          Checklists
        </h3>
        <div className="w-48">
          <ProgressBar checked={checked} total={total} />
        </div>
      </div>

      {error && <Alert>{errorMessage(error.error)}</Alert>}

      {checklists.map((checklist) => {
        const done = checklist.items.filter((item) => item.checked).length;
        return (
          <div key={checklist.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="mb-1 flex items-center gap-2">
              <EditableText
                key={checklist.title}
                label="Título da checklist"
                value={checklist.title}
                maxLength={100}
                disabled={!canEdit}
                className="text-sm font-medium"
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

            <ul className="mt-2 space-y-1">
              {checklist.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    aria-label={`Marcar ${item.text}`}
                    checked={item.checked}
                    disabled={!canEdit}
                    onChange={(event) => updateItem.mutate({ itemId: item.id, checked: event.target.checked })}
                    className="size-4 rounded border-slate-300 text-indigo-600"
                  />
                  <EditableText
                    key={item.text}
                    label="Texto do item"
                    value={item.text}
                    maxLength={200}
                    disabled={!canEdit}
                    className={`text-sm ${item.checked ? "text-slate-400 line-through" : ""}`}
                    onSave={(next) => updateItem.mutate({ itemId: item.id, text: next })}
                  />
                  {canEdit && (
                    <button
                      type="button"
                      aria-label={`Excluir item ${item.text}`}
                      onClick={() => deleteItem.mutate(item.id)}
                      className="rounded px-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {canEdit && <AddItemForm boardId={boardId} cardId={cardId} checklistId={checklist.id} />}
          </div>
        );
      })}

      {checklists.length === 0 && <p className="text-sm text-slate-500">Este card ainda não tem checklists.</p>}

      {canEdit && (
        <form onSubmit={addChecklist} noValidate className="flex gap-2">
          <input
            aria-label="Título da nova checklist"
            value={title}
            maxLength={100}
            placeholder="Nova checklist"
            onChange={(event) => setTitle(event.target.value)}
            className="min-w-0 flex-1 rounded-md border-0 bg-white px-2 py-1.5 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
          />
          <Button type="submit" size="sm" variant="secondary" loading={createChecklist.isPending}>
            Adicionar checklist
          </Button>
        </form>
      )}
    </section>
  );
}
