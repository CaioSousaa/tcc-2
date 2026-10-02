"use client";

import { useEffect, useMemo, useState } from "react";
import { Equal } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { BoardList } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface ListFormModalProps {
  open: boolean;
  boardId: string;
  lists: BoardList[];
  /** Lista em edição; ausente = criação. */
  list?: BoardList | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ListFormModal({ open, boardId, lists, list, onClose, onSaved }: ListFormModalProps) {
  const editing = Boolean(list);
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const maxPosition = editing ? lists.length - 1 : lists.length;

  useEffect(() => {
    if (!open) return;
    setTitle(list?.title ?? "");
    setPosition(list ? lists.findIndex((l) => l.id === list.id) : lists.length);
    setError(null);
    setSaving(false);
  }, [open, list, lists]);

  // Prévia da ordem final das listas com a lista atual destacada.
  const preview = useMemo(() => {
    const others = lists.filter((l) => l.id !== list?.id).map((l) => ({ id: l.id, title: l.title }));
    const current = { id: list?.id ?? "__new__", title: title.trim() || "Nova lista" };
    const index = Math.min(position, others.length);
    return [...others.slice(0, index), current, ...others.slice(index)];
  }, [lists, list, title, position]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Informe o nome da lista.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (list) {
        await api.patch(`/lists/${list.id}`, { title: title.trim(), position });
      } else {
        await api.post(`/boards/${boardId}/lists`, { title: title.trim(), position });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  const currentId = list?.id ?? "__new__";

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Lista" : "Nova lista"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nome da lista" htmlFor="list-title">
          <Input
            id="list-title"
            autoFocus
            placeholder="Ex.: Em progresso"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Posição no quadro" htmlFor="list-position">
          <Select
            id="list-position"
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          >
            {Array.from({ length: maxPosition + 1 }, (_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-col gap-1.5 rounded-[10px] border border-border bg-surface-alt p-[15px]">
          {preview.map((item) => {
            const isCurrent = item.id === currentId;
            return (
              <div
                key={item.id}
                className={`flex h-[33px] items-center gap-3 rounded-md border bg-surface px-3.5 ${
                  isCurrent ? "border-navy" : "border-border"
                }`}
              >
                <Equal className="size-3 text-placeholder" />
                <span className={`truncate text-[15px] text-ink ${isCurrent ? "font-semibold" : ""}`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>

        {error && <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>}

        <div className="flex justify-end gap-2.5 pt-1.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar lista
          </Button>
        </div>
      </form>
    </Modal>
  );
}
