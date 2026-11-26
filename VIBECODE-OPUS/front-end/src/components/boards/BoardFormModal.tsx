"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { FieldError, FieldLabel, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import { BOARD_COLORS } from "@/lib/colors";
import type { Board, BoardColor } from "@/lib/types";

interface BoardFormModalProps {
  open: boolean;
  /** Board being edited; omitted when creating a new board. */
  board?: Pick<
    Board,
    "id" | "title" | "description" | "color" | "blockListDeletionWithCards"
  > | null;
  onClose: () => void;
  onSaved: (board: Board) => void;
}

export function BoardFormModal({ open, board, onClose, onSaved }: BoardFormModalProps) {
  const toast = useToast();
  const editing = Boolean(board);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<BoardColor>("navy");
  const [withDefaultLists, setWithDefaultLists] = useState(true);
  const [blockDeletion, setBlockDeletion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(board?.title ?? "");
    setDescription(board?.description ?? "");
    setColor(board?.color ?? "navy");
    setBlockDeletion(board?.blockListDeletionWithCards ?? false);
    setWithDefaultLists(true);
    setError(null);
  }, [open, board]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Informe o nome do quadro");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        color,
        blockListDeletionWithCards: blockDeletion,
      };
      const { data } = editing
        ? await api.patch<{ board: Board }>(`/boards/${board!.id}`, payload)
        : await api.post<{ board: Board }>("/boards", { ...payload, withDefaultLists });
      toast.success(editing ? "Quadro atualizado" : "Quadro criado");
      onSaved(data.board);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o quadro"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar quadro" : "Novo quadro"}>
      <form onSubmit={handleSubmit} noValidate>
        <FieldLabel htmlFor="board-title">Nome do quadro</FieldLabel>
        <Input
          id="board-title"
          className="h-11"
          placeholder="Ex.: Sprint 13"
          autoFocus
          value={title}
          maxLength={120}
          onChange={(event) => setTitle(event.target.value)}
        />

        {editing && (
          <div className="mt-5">
            <FieldLabel htmlFor="board-description">Descrição</FieldLabel>
            <Textarea
              id="board-description"
              rows={3}
              placeholder="Opcional"
              value={description}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        )}

        <div className="mt-6">
          <FieldLabel>Cor</FieldLabel>
          <ColorPicker colors={BOARD_COLORS} value={color} onChange={setColor} />
        </div>

        {!editing && (
          <Checkbox
            className="mt-6 text-[15px] text-body"
            checked={withDefaultLists}
            onChange={setWithDefaultLists}
            label="Criar com listas padrão (A fazer, Em progresso, Concluído)"
          />
        )}

        <Checkbox
          className="mt-4 items-start text-[15px] text-body"
          checked={blockDeletion}
          onChange={setBlockDeletion}
          label={
            <span>
              Bloquear exclusão de listas que contêm cards
              <span className="block text-[13px] text-muted">
                Desmarcado: ao excluir uma lista com cards, o administrador
                escolhe entre mover ou excluir os cards.
              </span>
            </span>
          }
        />

        <FieldError message={error} />

        <div className="mt-7 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
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
