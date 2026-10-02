"use client";

import { useEffect, useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { BOARD_COLORS } from "@/lib/colors";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorSwatches } from "@/components/ui/ColorSwatches";
import { Field, FieldLabel, Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export interface BoardFormValue {
  id: string;
  title: string;
  description: string | null;
  color: string;
  blockNonEmptyListDeletion?: boolean;
}

interface BoardFormModalProps {
  open: boolean;
  board?: BoardFormValue | null;
  onClose: () => void;
  onSaved: (boardId: string) => void;
}

export function BoardFormModal({ open, board, onClose, onSaved }: BoardFormModalProps) {
  const editing = Boolean(board);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(BOARD_COLORS[0]);
  const [withDefaultLists, setWithDefaultLists] = useState(true);
  const [blockDeletion, setBlockDeletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(board?.title ?? "");
    setDescription(board?.description ?? "");
    setColor(board?.color ?? BOARD_COLORS[0]);
    setWithDefaultLists(true);
    setBlockDeletion(board?.blockNonEmptyListDeletion ?? false);
    setError(null);
    setSaving(false);
  }, [open, board]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Informe o nome do quadro.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (board) {
        await api.patch(`/boards/${board.id}`, {
          title: title.trim(),
          description: description.trim() || null,
          color,
          blockNonEmptyListDeletion: blockDeletion,
        });
        onSaved(board.id);
      } else {
        const { data } = await api.post<{ board: { id: string } }>("/boards", {
          title: title.trim(),
          color,
          withDefaultLists,
        });
        onSaved(data.board.id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar quadro" : "Novo quadro"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Nome do quadro" htmlFor="board-title">
          <Input
            id="board-title"
            autoFocus
            placeholder="Ex.: Sprint 13"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        {editing && (
          <Field label="Descrição" htmlFor="board-description">
            <Textarea
              id="board-description"
              rows={3}
              placeholder="Opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        )}

        <div className="flex flex-col gap-2">
          <FieldLabel>Cor</FieldLabel>
          <ColorSwatches colors={BOARD_COLORS} value={color} onChange={setColor} />
        </div>

        {editing ? (
          <label className="flex cursor-pointer gap-3 text-[15.5px] leading-[1.4] text-body">
            <Checkbox checked={blockDeletion} onChange={setBlockDeletion} className="mt-0.5" />
            <span>
              Bloquear exclusão de listas que ainda tenham cards
              <span className="block text-[13.5px] text-muted">
                Regra do quadro aplicada a todos os administradores.
              </span>
            </span>
          </label>
        ) : (
          <label className="flex cursor-pointer gap-3 text-[15.5px] leading-[1.4] text-body">
            <Checkbox checked={withDefaultLists} onChange={setWithDefaultLists} className="mt-0.5" />
            Criar com listas padrão (A fazer, Em progresso, Concluído)
          </label>
        )}

        {error && <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>}

        <div className="flex justify-end gap-2.5 pt-1.5">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {editing ? "Salvar quadro" : "Criar quadro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
