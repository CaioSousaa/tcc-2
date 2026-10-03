"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Checklist, ChecklistItem, Progress } from "@/lib/types";

function Bar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
      <div
        className={`h-full rounded-full transition-all ${percent === 100 ? "bg-green" : "bg-blue"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

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
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center gap-2">
        <h4 className="flex-1 text-sm font-semibold text-ink">{checklist.title}</h4>
        <IconButton aria-label="Excluir checklist" onClick={removeChecklist}>
          <Trash2 size={14} />
        </IconButton>
      </div>
      <div className="mb-3 flex items-center gap-2">
        <span className="w-9 text-xs tabular-nums text-muted">{percent}%</span>
        <Bar percent={percent} />
      </div>
      <ul className="space-y-1">
        {checklist.items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-surface-alt">
            <input
              type="checkbox"
              checked={item.done}
              onChange={() => toggle(item)}
              className="h-4 w-4 accent-navy"
            />
            <span className={`flex-1 text-sm ${item.done ? "text-muted line-through" : "text-body"}`}>
              {item.text}
            </span>
            <IconButton
              aria-label="Excluir item"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100"
              onClick={() => removeItem(item)}
            >
              <Trash2 size={13} />
            </IconButton>
          </li>
        ))}
      </ul>
      <form onSubmit={addItem} className="mt-2 flex gap-2">
        <input
          value={text}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          placeholder="Adicionar item"
          className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
        />
        <Button type="submit" variant="secondary" className="h-8" disabled={!text.trim()}>
          <Plus size={14} /> Item
        </Button>
      </form>
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
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">Checklists</h3>
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
            className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm text-ink focus:border-navy focus:outline-none"
          />
          <Button type="submit" className="h-8" disabled={!title.trim()}>
            Criar
          </Button>
          <Button type="button" variant="ghost" className="h-8" onClick={() => setAdding(false)}>
            Cancelar
          </Button>
        </form>
      ) : (
        <Button variant="secondary" className="h-8" onClick={() => setAdding(true)}>
          <Plus size={14} /> Adicionar checklist
        </Button>
      )}
    </section>
  );
}
