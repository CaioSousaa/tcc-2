"use client";

import { Equal } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError, Select } from "@/components/ui/Field";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { ListWithCards } from "@/lib/types";

export function ListModal({
  boardId,
  lists,
  list,
  onClose,
  onSaved,
}: {
  boardId: string;
  lists: ListWithCards[];
  list?: ListWithCards;
  onClose: () => void;
  onSaved: () => void;
}) {
  const others = useMemo(() => lists.filter((l) => l.id !== list?.id), [lists, list]);
  const initialIndex = list ? lists.findIndex((l) => l.id === list.id) : lists.length;
  const [name, setName] = useState(list?.name ?? "");
  const [index, setIndex] = useState(initialIndex);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const order = useMemo(() => {
    const items: { key: string; name: string; current: boolean }[] = others.map((l) => ({
      key: l.id,
      name: l.name,
      current: false,
    }));
    items.splice(index, 0, { key: "current", name: name.trim() || "Nova lista", current: true });
    return items;
  }, [others, index, name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (list) {
        if (name.trim() !== list.name) await api.patch(`/lists/${list.id}`, { name });
        if (index !== initialIndex) await api.patch(`/lists/${list.id}/move`, { position: index });
      } else {
        await api.post(`/boards/${boardId}/lists`, { name, position: index });
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title="Lista" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-5">
        <Field
          label="Nome da lista"
          autoFocus
          maxLength={100}
          placeholder="Ex.: Em progresso"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Select
          label="Posição no quadro"
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
        >
          {Array.from({ length: others.length + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i + 1}
            </option>
          ))}
        </Select>
        <div className="flex flex-col gap-1.5 rounded-[10px] border border-border bg-surface-alt p-[15px]">
          {order.map((item) => (
            <div
              key={item.key}
              className={`flex h-[33px] items-center gap-3 rounded-md border bg-surface px-3.5 text-[15px] text-ink ${
                item.current ? "border-navy font-semibold" : "border-border"
              }`}
            >
              <Equal size={12} className="shrink-0 text-placeholder" />
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
        <FormError message={error} />
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            Salvar lista
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
