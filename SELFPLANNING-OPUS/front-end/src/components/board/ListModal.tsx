"use client";

import { Equal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { BoardListData } from "@/lib/types";

interface ListModalProps {
  boardId: string;
  lists: BoardListData[];
  /** Lista em edição; sem ela o modal cria uma nova lista */
  list?: BoardListData;
  onClose: () => void;
  onSaved: () => void;
}

const NEW_LIST_ID = "__new__";

export function ListModal({ boardId, lists, list, onClose, onSaved }: ListModalProps) {
  const others = lists.filter((l) => l.id !== list?.id);
  const currentIndex = list ? lists.findIndex((l) => l.id === list.id) : others.length;

  const [name, setName] = useState(list?.name ?? "");
  const [position, setPosition] = useState(currentIndex);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    const items = others.map((l) => ({ id: l.id, name: l.name }));
    items.splice(position, 0, { id: list?.id ?? NEW_LIST_ID, name: name.trim() || "Nova lista" });
    return items;
  }, [others, position, list, name]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!list) {
        await api.post(`/boards/${boardId}/lists`, { name, position });
      } else {
        if (name.trim() !== list.name) {
          await api.patch(`/boards/${boardId}/lists/${list.id}`, { name });
        }
        if (position !== currentIndex) {
          await api.put(`/boards/${boardId}/lists/order`, { listIds: preview.map((l) => l.id) });
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Modal title={list ? "Editar lista" : "Nova lista"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Nome da lista"
          name="list-name"
          autoFocus
          required
          maxLength={120}
          placeholder="Ex.: Em revisão"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-body">Posição no quadro</span>
          <Select value={position} onChange={(e) => setPosition(Number(e.target.value))}>
            {Array.from({ length: others.length + 1 }, (_, index) => (
              <option key={index} value={index}>
                {index === 0
                  ? "Primeira posição"
                  : index === others.length
                    ? "Última posição"
                    : `Depois de “${others[index - 1].name}”`}
              </option>
            ))}
          </Select>
        </label>

        <ol className="flex flex-col gap-1.5 rounded-[10px] border border-border bg-surface-alt p-[15px]">
          {preview.map((item) => {
            const highlighted = item.id === (list?.id ?? NEW_LIST_ID);
            return (
              <li
                key={item.id}
                className={`flex h-[33px] items-center gap-3 rounded-md border bg-white px-3.5 text-[15px] text-ink ${
                  highlighted ? "border-navy font-semibold" : "border-border"
                }`}
              >
                <Equal size={12} className="text-placeholder" />
                <span className="truncate">{item.name}</span>
              </li>
            );
          })}
        </ol>

        <FormError message={error} />
        <div className="flex justify-end gap-2.5 pt-1.5">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Salvar lista
          </Button>
        </div>
      </form>
    </Modal>
  );
}
