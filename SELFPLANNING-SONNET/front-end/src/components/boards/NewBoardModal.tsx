"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Checkbox, Field, FormError } from "@/components/ui/Field";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { BOARD_COLORS, DEFAULT_BOARD_COLOR } from "@/lib/colors";
import type { BoardSummary } from "@/lib/types";

export function NewBoardModal({
  board,
  onClose,
  onSaved,
}: {
  board?: BoardSummary;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(board?.name ?? "");
  const [color, setColor] = useState(board?.color ?? DEFAULT_BOARD_COLOR);
  const [defaultLists, setDefaultLists] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (board) {
        await api.patch(`/boards/${board.id}`, { name, color });
      } else {
        await api.post("/boards", { name, color, defaultLists });
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title={board ? "Editar quadro" : "Novo quadro"} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field
          label="Nome do quadro"
          autoFocus
          maxLength={100}
          placeholder="Ex.: Sprint 13"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div>
          <span className="mb-2 block text-sm font-medium text-body">Cor</span>
          <ColorPicker colors={BOARD_COLORS} value={color} onChange={setColor} />
        </div>
        {!board && (
          <Checkbox
            className="text-[15.5px] leading-[22px]"
            label="Criar com listas padrão (A fazer, Em progresso, Concluído)"
            checked={defaultLists}
            onChange={(e) => setDefaultLists(e.target.checked)}
          />
        )}
        <FormError message={error} />
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {board ? "Salvar" : "Criar quadro"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
