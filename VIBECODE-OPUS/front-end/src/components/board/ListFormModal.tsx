"use client";

import { useEffect, useMemo, useState } from "react";
import { Equal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FieldError, FieldLabel, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { BoardList } from "@/lib/types";

interface ListFormModalProps {
  open: boolean;
  lists: BoardList[];
  /** List being edited; null to create a new one. */
  list: BoardList | null;
  onClose: () => void;
  onSubmit: (values: { title: string; position: number }) => Promise<void>;
}

const NEW_LIST_KEY = "__new__";

export function ListFormModal({ open, lists, list, onClose, onSubmit }: ListFormModalProps) {
  const [title, setTitle] = useState("");
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const slots = list ? lists.length : lists.length + 1;

  useEffect(() => {
    if (!open) return;
    setTitle(list?.title ?? "");
    setPosition(list ? lists.findIndex((item) => item.id === list.id) : lists.length);
    setError(null);
  }, [open, list, lists]);

  /** Preview of the board order with the list at the chosen position. */
  const preview = useMemo(() => {
    const others = lists.filter((item) => item.id !== list?.id);
    const entries = others.map((item) => ({ key: item.id, title: item.title }));
    entries.splice(Math.min(position, entries.length), 0, {
      key: list?.id ?? NEW_LIST_KEY,
      title: title.trim() || "Nova lista",
    });
    return entries;
  }, [lists, list, position, title]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Informe o nome da lista");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), position });
    } catch {
      // The caller already reported the error.
    } finally {
      setSaving(false);
    }
  }

  const currentKey = list?.id ?? NEW_LIST_KEY;

  return (
    <Modal open={open} onClose={onClose} title={list ? "Lista" : "Nova lista"}>
      <form onSubmit={handleSubmit} noValidate>
        <FieldLabel htmlFor="list-title">Nome da lista</FieldLabel>
        <Input
          id="list-title"
          className="h-11"
          autoFocus
          placeholder="Ex.: Em revisão"
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />
        <FieldError message={error} />

        <div className="mt-6">
          <FieldLabel htmlFor="list-position">Posição no quadro</FieldLabel>
          <Select
            id="list-position"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
          >
            {Array.from({ length: slots }, (_, index) => (
              <option key={index} value={index}>
                {index + 1}
              </option>
            ))}
          </Select>
        </div>

        <ol className="mt-5 flex flex-col gap-1.5 rounded-xl border border-border bg-surface-alt p-3.5">
          {preview.map((entry) => (
            <li
              key={entry.key}
              className={`flex items-center gap-3 rounded-md border bg-surface px-3.5 py-1.5 text-[15px] ${
                entry.key === currentKey
                  ? "border-navy font-semibold text-ink"
                  : "border-border text-body"
              }`}
            >
              <Equal size={13} className="text-placeholder" />
              {entry.title}
            </li>
          ))}
        </ol>

        <div className="mt-7 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {list ? "Salvar lista" : "Criar lista"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
