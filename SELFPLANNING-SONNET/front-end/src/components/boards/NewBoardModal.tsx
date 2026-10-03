"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
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
  const [description, setDescription] = useState(board?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (board) {
        await api.patch(`/boards/${board.id}`, { name, description });
      } else {
        await api.post("/boards", { name, description });
      }
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title={board ? "Editar quadro" : "Novo quadro"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <Field
          label="Nome do quadro"
          autoFocus
          maxLength={100}
          placeholder="Ex.: Redesign do app"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="Descrição (opcional)"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <FormError message={error} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {board ? "Salvar" : "Criar quadro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
