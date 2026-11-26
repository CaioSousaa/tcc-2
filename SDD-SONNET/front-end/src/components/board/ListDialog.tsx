"use client";

import { Equal } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import { previewListOrder } from "@/lib/board-state";
import { LIMITS } from "@/lib/constants";
import type { ListWithCards } from "@/lib/types";
import { validateText } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Dialog, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { useBoardContext } from "./BoardContext";

interface ListDialogProps {
  open: boolean;
  /** Lista em edição; `null` cria uma nova. */
  list: ListWithCards | null;
  onClose: () => void;
}

/** Modal "Lista" do protótipo: nome, posição no quadro e prévia da ordem das listas. */
export function ListDialog({ open, list, onClose }: ListDialogProps) {
  const title = list ? "Editar lista" : "Nova lista";
  return (
    <Dialog open={open} onClose={onClose} label={title}>
      <ListForm key={list?.id ?? "new"} title={title} list={list} onClose={onClose} />
    </Dialog>
  );
}

function ListForm({
  title,
  list,
  onClose,
}: {
  title: string;
  list: ListWithCards | null;
  onClose: () => void;
}) {
  const { boardId, data, reload } = useBoardContext();
  const currentIndex = list ? data.lists.findIndex((item) => item.id === list.id) : -1;
  const slots = list ? data.lists.length : data.lists.length + 1;

  const [name, setName] = useState(list?.name ?? "");
  const [index, setIndex] = useState(list ? Math.max(0, currentIndex) : data.lists.length);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const preview = previewListOrder(data.lists, list?.id ?? null, name.trim() || "Nova lista", index);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateText(name, "Nome da lista", LIMITS.listName.min, LIMITS.listName.max);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (list) {
        if (name.trim() !== list.name) await api.patch(`/lists/${list.id}`, { name });
        if (index !== currentIndex) await api.post(`/lists/${list.id}/move`, { position: index });
      } else {
        const created = await api.post<{ id: string }>(`/boards/${boardId}/lists`, { name });
        if (index < data.lists.length) {
          await api.post(`/lists/${created.data.id}/move`, { position: index });
        }
      }
      await reload();
      onClose();
    } catch (cause) {
      const apiError = toApiError(cause);
      setError(apiError.fieldMessage("name") ?? apiError.message);
      setPending(false);
      if (apiError.status === 404) await reload();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ModalBody>
        <ModalHeader title={title} onClose={onClose} />
        <Field
          id="list-name"
          label="Nome da lista"
          autoFocus
          placeholder="Ex.: Em progresso"
          value={name}
          error={error}
          onChange={(event) => setName(event.target.value)}
        />
        <Select
          id="list-position"
          label="Posição no quadro"
          value={index}
          onChange={(event) => setIndex(Number(event.target.value))}
        >
          {Array.from({ length: slots }, (_, position) => (
            <option key={position} value={position}>
              {position + 1}
            </option>
          ))}
        </Select>
        <div className="space-y-1.5 rounded-[10px] border border-border bg-surface-alt p-[15px]">
          <p className="sr-only">Ordem das listas</p>
          <ol className="space-y-1.5">
            {preview.map((item) => (
              <li
                key={item.id ?? "nova"}
                className={`flex h-[33px] items-center gap-3 rounded-md border bg-surface px-3.5 text-[15px] ${
                  item.highlighted ? "border-navy font-semibold" : "border-border"
                }`}
              >
                <Equal size={12} className="text-placeholder" aria-hidden />
                <span className="truncate">{item.name}</span>
              </li>
            ))}
          </ol>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Salvar lista
          </Button>
        </ModalFooter>
      </ModalBody>
    </form>
  );
}
