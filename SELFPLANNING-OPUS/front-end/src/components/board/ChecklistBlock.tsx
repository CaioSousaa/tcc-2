"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { inputClass } from "@/components/ui/Field";
import { InlineText } from "@/components/ui/InlineText";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { api } from "@/lib/api";
import type { Checklist } from "@/lib/types";

interface ChecklistBlockProps {
  boardId: string;
  checklist: Checklist;
  canEdit: boolean;
  /** Executa a ação, trata erros e recarrega o card */
  run: (action: () => Promise<unknown>) => Promise<void>;
}

export function ChecklistBlock({ boardId, checklist, canEdit, run }: ChecklistBlockProps) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const base = `/boards/${boardId}`;

  async function addItem() {
    const value = content.trim();
    if (!value) return;
    await run(() => api.post(`${base}/checklists/${checklist.id}/items`, { content: value }));
    setContent("");
  }

  function removeChecklist() {
    if (!window.confirm(`Excluir o checklist “${checklist.title}” e todos os itens?`)) return;
    run(() => api.delete(`${base}/checklists/${checklist.id}`));
  }

  return (
    <section className="flex flex-col gap-3.5">
      <header className="flex items-center justify-between gap-3">
        <InlineText
          value={checklist.title}
          editable={canEdit}
          maxLength={120}
          onSave={(title) => run(() => api.patch(`${base}/checklists/${checklist.id}`, { title }))}
          className="text-[13.5px] font-medium text-body"
          inputClassName="text-[13.5px]"
        />
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-[12.5px] text-muted">
            {checklist.progress.done}/{checklist.progress.total} concluídos
          </span>
          {canEdit && (
            <IconButton label="Excluir checklist" size={26} onClick={removeChecklist}>
              <Trash2 size={12} />
            </IconButton>
          )}
        </div>
      </header>

      <ProgressBar percent={checklist.progress.percent} height={5} />

      {checklist.items.length > 0 && (
        <ul className="flex flex-col gap-3 pl-[11px] pt-1.5">
          {checklist.items.map((item) => (
            <li key={item.id} className="group flex items-center gap-3">
              <Checkbox
                label={item.content}
                checked={item.done}
                disabled={!canEdit}
                onChange={(done) => run(() => api.patch(`${base}/checklist-items/${item.id}`, { done }))}
              />
              <InlineText
                value={item.content}
                editable={canEdit}
                maxLength={300}
                onSave={(value) =>
                  run(() => api.patch(`${base}/checklist-items/${item.id}`, { content: value }))
                }
                className={`flex-1 px-1 text-[15.5px] ${item.done ? "text-placeholder line-through" : "text-ink"}`}
                inputClassName="text-[15px]"
              />
              {canEdit && (
                <button
                  type="button"
                  aria-label="Excluir item"
                  title="Excluir item"
                  onClick={() => run(() => api.delete(`${base}/checklist-items/${item.id}`))}
                  className="text-placeholder opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit &&
        (adding ? (
          <div className="flex gap-2">
            <input
              autoFocus
              maxLength={300}
              value={content}
              placeholder="Texto do item"
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addItem();
                if (e.key === "Escape") setAdding(false);
              }}
              className={`${inputClass} h-9`}
            />
            <Button compact onClick={addItem}>
              Adicionar
            </Button>
            <IconButton label="Cancelar" size={36} onClick={() => setAdding(false)}>
              <X size={14} />
            </IconButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md border border-dashed border-border-strong px-[13px] text-sm text-muted hover:bg-surface-alt"
          >
            <Plus size={13} /> Adicionar item
          </button>
        ))}
    </section>
  );
}
