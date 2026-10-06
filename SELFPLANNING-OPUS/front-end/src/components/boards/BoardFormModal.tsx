"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Field, FormError } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { BOARD_COLORS } from "@/lib/format";

interface BoardFormModalProps {
  /** Quando informado, o modal edita o quadro em vez de criar um novo */
  board?: { id: string; name: string; color: string };
  onClose: () => void;
  onSaved: (board: { id: string; name: string; color: string }) => void;
}

export function BoardFormModal({ board, onClose, onSaved }: BoardFormModalProps) {
  const [name, setName] = useState(board?.name ?? "");
  const [color, setColor] = useState(board?.color ?? BOARD_COLORS[0]);
  const [withDefaultLists, setWithDefaultLists] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data } = board
        ? await api.patch(`/boards/${board.id}`, { name, color })
        : await api.post("/boards", { name, color, withDefaultLists });
      onSaved(data);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Modal title={board ? "Editar quadro" : "Novo quadro"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field
          label="Nome do quadro"
          name="board-name"
          autoFocus
          required
          maxLength={120}
          placeholder="Ex.: Redesign do app · Sprint 12"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-body">Cor</span>
          <ColorPicker colors={BOARD_COLORS} value={color} onChange={setColor} />
        </div>
        {!board && (
          <label className="flex cursor-pointer items-center gap-3 text-[15.5px] text-body">
            <Checkbox checked={withDefaultLists} onChange={setWithDefaultLists} label="Criar com listas padrão" />
            Criar com listas padrão (A fazer, Em progresso, Concluído)
          </label>
        )}
        <FormError message={error} />
        <div className="flex justify-end gap-2.5 pt-1.5">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            {board ? "Salvar" : "Criar quadro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
