"use client";

import { useState } from "react";
import { Plus, Trash, X } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { Checklist, ChecklistItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "./ProgressBar";

interface ChecklistBlockProps {
  checklist: Checklist;
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
}

function ChecklistItemRow({
  item,
  onChanged,
  onError,
}: {
  item: ChecklistItem;
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(item.content);
  const [done, setDone] = useState(item.done);

  async function toggle(value: boolean) {
    setDone(value);
    try {
      await api.patch(`/checklist-items/${item.id}`, { done: value });
      await onChanged();
    } catch (err) {
      setDone(!value);
      onError(getErrorMessage(err));
    }
  }

  async function save() {
    const value = content.trim();
    setEditing(false);
    if (!value || value === item.content) {
      setContent(item.content);
      return;
    }
    try {
      await api.patch(`/checklist-items/${item.id}`, { content: value });
      await onChanged();
    } catch (err) {
      setContent(item.content);
      onError(getErrorMessage(err));
    }
  }

  async function remove() {
    try {
      await api.delete(`/checklist-items/${item.id}`);
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <li className="group flex min-h-[28px] items-center gap-3">
      <Checkbox checked={done} onChange={toggle} label={item.content} />
      {editing ? (
        <input
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              setContent(item.content);
              setEditing(false);
            }
          }}
          className="flex-1 rounded-md border border-navy px-2 py-1 text-[15.5px] text-ink outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`flex-1 text-left text-[15.5px] ${done ? "text-placeholder line-through" : "text-ink"}`}
        >
          {item.content}
        </button>
      )}
      <button
        type="button"
        aria-label="Excluir item"
        onClick={remove}
        className="rounded p-1 text-placeholder opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function ChecklistBlock({ checklist, onChanged, onError }: ChecklistBlockProps) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(checklist.title);

  const total = checklist.items.length;
  const done = checklist.items.filter((i) => i.done).length;

  async function addItem(event?: React.FormEvent) {
    event?.preventDefault();
    const value = content.trim();
    if (!value) return;
    try {
      await api.post(`/checklists/${checklist.id}/items`, { content: value });
      setContent("");
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  async function saveTitle() {
    setEditingTitle(false);
    const value = title.trim();
    if (!value || value === checklist.title) {
      setTitle(checklist.title);
      return;
    }
    try {
      await api.patch(`/checklists/${checklist.id}`, { title: value });
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  async function removeChecklist() {
    if (!window.confirm(`Excluir a checklist “${checklist.title}” e seus ${total} itens?`)) return;
    try {
      await api.delete(`/checklists/${checklist.id}`);
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between gap-3">
        {editingTitle ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setTitle(checklist.title);
                setEditingTitle(false);
              }
            }}
            className="rounded-md border border-navy px-2 py-0.5 text-[13.5px] font-medium text-body outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-[13.5px] font-medium text-body hover:text-ink"
          >
            {checklist.title}
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12.5px] text-muted">
            {done}/{total} concluídos
          </span>
          <IconButton icon={Trash} label="Excluir checklist" size={26} onClick={removeChecklist} />
        </div>
      </div>

      <ProgressBar done={done} total={total} height={5} />

      {total > 0 && (
        <ul className="flex flex-col gap-2.5 pl-[11px] pt-1.5">
          {checklist.items.map((item) => (
            <ChecklistItemRow key={`${item.id}-${item.done}-${item.content}`} item={item} onChanged={onChanged} onError={onError} />
          ))}
        </ul>
      )}

      {adding ? (
        <form onSubmit={addItem} className="flex gap-2 pl-[11px]">
          <Input
            autoFocus
            className="h-9"
            placeholder="Novo item"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAdding(false);
                setContent("");
              }
            }}
          />
          <Button type="submit" size="sm">
            Adicionar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Fechar
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="h-9 w-fit rounded-md border border-dashed border-dash px-[13px] text-sm text-muted hover:border-muted hover:text-ink"
        >
          + Adicionar item
        </button>
      )}
    </div>
  );
}

export function ChecklistSection({
  cardId,
  checklists,
  onChanged,
  onError,
}: {
  cardId: string;
  checklists: Checklist[];
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("Checklist");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    try {
      await api.post(`/cards/${cardId}/checklists`, { title: value });
      setCreating(false);
      setTitle("Checklist");
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {checklists.map((checklist) => (
        <ChecklistBlock key={checklist.id} checklist={checklist} onChanged={onChanged} onError={onError} />
      ))}

      {creating ? (
        <form onSubmit={create} className="flex flex-col gap-2 rounded-[10px] border border-border bg-surface-alt p-3">
          <span className="text-[13.5px] font-medium text-body">Nova checklist</span>
          <div className="flex gap-2">
            <Input autoFocus className="h-10" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button type="submit" size="sm" className="h-10">
              Criar
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex h-9 w-fit items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-ink hover:bg-surface-alt"
        >
          <Plus className="size-3.5" />
          Adicionar checklist
        </button>
      )}
    </section>
  );
}
