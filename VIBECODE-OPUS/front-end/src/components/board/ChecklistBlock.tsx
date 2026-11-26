"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import type { Checklist, ChecklistItem } from "@/lib/types";

interface ChecklistBlockProps {
  checklist: Checklist;
  onChange: (checklist: Checklist) => void;
  onDeleted: (checklistId: string) => void;
}

function ItemRow({
  item,
  onToggle,
  onRename,
  onDelete,
}: {
  item: ChecklistItem;
  onToggle: (done: boolean) => void;
  onRename: (text: string) => Promise<boolean>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);

  async function save() {
    if (!text.trim()) return;
    if (await onRename(text.trim())) setEditing(false);
  }

  if (editing) {
    return (
      <li className="flex items-center gap-2 py-1">
        <Input
          className="h-9 text-[15px]"
          autoFocus
          value={text}
          maxLength={255}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") save();
            if (event.key === "Escape") setEditing(false);
          }}
        />
        <IconButton label="Salvar item" onClick={save}>
          <Check size={13} />
        </IconButton>
        <IconButton
          label="Cancelar edição"
          onClick={() => {
            setText(item.text);
            setEditing(false);
          }}
        >
          <X size={13} />
        </IconButton>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 rounded-md px-3 py-[7px] hover:bg-surface-alt">
      <Checkbox
        checked={item.done}
        onChange={onToggle}
        ariaLabel={`Marcar "${item.text}" como ${item.done ? "pendente" : "concluído"}`}
      />
      <span
        className={`flex-1 break-words text-[16px] ${item.done ? "text-placeholder" : "text-ink"}`}
      >
        {item.text}
      </span>
      <span className="flex gap-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        <IconButton label="Editar item" size={26} onClick={() => setEditing(true)}>
          <Pencil size={12} />
        </IconButton>
        <IconButton label="Excluir item" size={26} onClick={onDelete}>
          <Trash2 size={12} />
        </IconButton>
      </span>
    </li>
  );
}

export function ChecklistBlock({ checklist, onChange, onDeleted }: ChecklistBlockProps) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(checklist.title);
  const [busy, setBusy] = useState(false);

  const total = checklist.items.length;
  const done = checklist.items.filter((item) => item.done).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function call<T>(request: () => Promise<{ data: T }>): Promise<T | null> {
    try {
      const { data } = await request();
      return data;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return null;
    }
  }

  async function addItem() {
    if (!newItem.trim()) return;
    setBusy(true);
    const data = await call(() =>
      api.post<{ checklist: Checklist }>(`/checklists/${checklist.id}/items`, {
        text: newItem.trim(),
      }),
    );
    setBusy(false);
    if (data) {
      onChange(data.checklist);
      setNewItem("");
    }
  }

  async function updateItem(item: ChecklistItem, changes: Partial<ChecklistItem>) {
    // Optimistic toggle keeps the checkbox responsive.
    onChange({
      ...checklist,
      items: checklist.items.map((current) =>
        current.id === item.id ? { ...current, ...changes } : current,
      ),
    });
    const data = await call(() =>
      api.patch<{ checklist: Checklist }>(`/checklist-items/${item.id}`, changes),
    );
    onChange(data ? data.checklist : checklist);
    return Boolean(data);
  }

  async function deleteItem(item: ChecklistItem) {
    const data = await call(() =>
      api.delete<{ checklist: Checklist }>(`/checklist-items/${item.id}`),
    );
    if (data) onChange(data.checklist);
  }

  async function saveTitle() {
    if (!title.trim()) return;
    const data = await call(() =>
      api.patch<{ checklist: Checklist }>(`/checklists/${checklist.id}`, {
        title: title.trim(),
      }),
    );
    if (data) {
      onChange(data.checklist);
      setEditingTitle(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Excluir o checklist "${checklist.title}" e seus itens?`)) return;
    const ok = await call(() => api.delete(`/checklists/${checklist.id}`));
    if (ok !== null) onDeleted(checklist.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        {editingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              className="h-9 text-[15px]"
              autoFocus
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveTitle();
                if (event.key === "Escape") setEditingTitle(false);
              }}
            />
            <IconButton label="Salvar título" onClick={saveTitle}>
              <Check size={13} />
            </IconButton>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="text-[15px] text-body hover:text-ink"
            title="Renomear checklist"
          >
            {checklist.title}
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[13px] text-muted">
            {done}/{total} concluídos
          </span>
          <IconButton label="Excluir checklist" size={26} onClick={remove}>
            <Trash2 size={12} />
          </IconButton>
        </div>
      </div>

      <div
        className="mt-3 h-1 overflow-hidden rounded-sm bg-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progresso do checklist ${checklist.title}`}
      >
        <div className="h-full rounded-sm bg-green transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <ul className="mt-3 flex flex-col">
        {checklist.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggle={(value) => updateItem(item, { done: value })}
            onRename={(text) => updateItem(item, { text })}
            onDelete={() => deleteItem(item)}
          />
        ))}
      </ul>

      {adding ? (
        <div className="mt-2 flex items-center gap-2">
          <Input
            className="h-10 text-[15px]"
            autoFocus
            placeholder="Novo item"
            value={newItem}
            maxLength={255}
            onChange={(event) => setNewItem(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addItem();
              if (event.key === "Escape") setAdding(false);
            }}
          />
          <Button size="sm" loading={busy} onClick={addItem} disabled={!newItem.trim()}>
            Adicionar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" className="mt-2.5" onClick={() => setAdding(true)}>
          <Plus size={14} /> Adicionar item
        </Button>
      )}
    </div>
  );
}
