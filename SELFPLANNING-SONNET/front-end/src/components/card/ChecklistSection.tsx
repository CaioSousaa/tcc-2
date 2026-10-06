"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProgressBar } from "@/components/kanban/CardItem";
import { Button } from "@/components/ui/Button";
import { CheckboxBox } from "@/components/ui/Field";
import { api } from "@/lib/api";
import type { Checklist, ChecklistItem, Progress } from "@/lib/types";

const DASHED_BUTTON =
  "inline-flex h-9 items-center self-start rounded-md border border-dashed border-[#C5CAD3] px-[13px] text-sm text-muted hover:border-navy hover:text-navy";

function ChecklistBlock({
  checklist,
  onChange,
  onRemoved,
  onProgress,
  onError,
}: {
  checklist: Checklist;
  onChange: (c: Checklist) => void;
  onRemoved: () => void;
  onProgress: (p: Progress | null) => void;
  onError: (e: unknown) => void;
}) {
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const done = checklist.items.filter((i) => i.done).length;
  const total = checklist.items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  async function toggle(item: ChecklistItem) {
    onChange({
      ...checklist,
      items: checklist.items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
    });
    try {
      const { data } = await api.patch<{ progress: Progress | null }>(`/items/${item.id}`, {
        done: !item.done,
      });
      onProgress(data.progress);
    } catch (err) {
      onChange(checklist);
      onError(err);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      const { data } = await api.post<{ item: ChecklistItem; progress: Progress | null }>(
        `/checklists/${checklist.id}/items`,
        { text: value },
      );
      onChange({ ...checklist, items: [...checklist.items, data.item] });
      onProgress(data.progress);
      setText("");
    } catch (err) {
      onError(err);
    }
  }

  async function removeItem(item: ChecklistItem) {
    try {
      const { data } = await api.delete<{ progress: Progress | null }>(`/items/${item.id}`);
      onChange({ ...checklist, items: checklist.items.filter((i) => i.id !== item.id) });
      onProgress(data.progress);
    } catch (err) {
      onError(err);
    }
  }

  async function removeChecklist() {
    try {
      const { data } = await api.delete<{ progress: Progress | null }>(`/checklists/${checklist.id}`);
      onProgress(data.progress);
      onRemoved();
    } catch (err) {
      onError(err);
    }
  }

  return (
    <div className="group/checklist flex w-full flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13.5px] font-medium text-body">{checklist.title}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Excluir checklist"
            onClick={removeChecklist}
            className="text-muted opacity-0 transition-opacity group-focus-within/checklist:opacity-100 group-hover/checklist:opacity-100 hover:text-red"
          >
            <Trash2 size={13} />
          </button>
          <span className="font-mono text-[12.5px] text-muted">
            {done}/{total} concluídos
          </span>
        </div>
      </div>
      <ProgressBar percent={percent} className="h-[5px] w-full flex-none rounded-[3px] [&>div]:rounded-[3px]" />
      <ul className="flex flex-col gap-4 pt-1.5 pl-[11px]">
        {checklist.items.map((item) => (
          <li key={item.id} className="group flex items-center gap-3">
            <CheckboxBox
              aria-label={item.text}
              checked={item.done}
              onChange={() => toggle(item)}
            />
            <span className={`flex-1 text-[15.5px] ${item.done ? "text-placeholder" : "text-ink"}`}>
              {item.text}
            </span>
            <button
              type="button"
              aria-label="Excluir item"
              onClick={() => removeItem(item)}
              className="text-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-red"
            >
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <form onSubmit={addItem} className="flex gap-2">
          <input
            autoFocus
            value={text}
            maxLength={300}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
            placeholder="Novo item"
            className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-[15px] text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
          />
          <Button type="submit" size="sm" disabled={!text.trim()}>
            Adicionar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
            Fechar
          </Button>
        </form>
      ) : (
        <button type="button" className={DASHED_BUTTON} onClick={() => setAdding(true)}>
          + Adicionar item
        </button>
      )}
    </div>
  );
}

export function ChecklistSection({
  cardId,
  checklists,
  onChange,
  onProgress,
  onError,
}: {
  cardId: string;
  checklists: Checklist[];
  onChange: (checklists: Checklist[]) => void;
  onProgress: (p: Progress | null) => void;
  onError: (e: unknown) => void;
}) {
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    try {
      const { data } = await api.post<Checklist & { progress: Progress | null }>(
        `/cards/${cardId}/checklists`,
        { title: value },
      );
      const { progress, ...checklist } = data;
      onChange([...checklists, checklist]);
      onProgress(progress);
      setTitle("");
      setAdding(false);
    } catch (err) {
      onError(err);
    }
  }

  return (
    <section className="flex w-full flex-col gap-6">
      {checklists.map((c) => (
        <ChecklistBlock
          key={c.id}
          checklist={c}
          onChange={(next) => onChange(checklists.map((x) => (x.id === c.id ? next : x)))}
          onRemoved={() => onChange(checklists.filter((x) => x.id !== c.id))}
          onProgress={onProgress}
          onError={onError}
        />
      ))}
      {adding ? (
        <form onSubmit={create} className="flex gap-2">
          <input
            autoFocus
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
            placeholder="Título da checklist"
            className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-[15px] text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
          />
          <Button type="submit" size="sm" disabled={!title.trim()}>
            Criar
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <button type="button" className={DASHED_BUTTON} onClick={() => setAdding(true)}>
          <Plus size={14} className="mr-1.5" />
          {checklists.length === 0 ? "Adicionar checklist" : "Nova checklist"}
        </button>
      )}
    </section>
  );
}
