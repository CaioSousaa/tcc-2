"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextArea, TextField } from "@/components/ui/TextField";
import { parseApiError } from "@/lib/api";
import { useCreateBoard, useUpdateBoard } from "@/lib/boards";
import type { BoardSummary } from "@/lib/types";

interface BoardFormModalProps {
  open: boolean;
  onClose: () => void;
  /** When set the form edits this board, otherwise it creates a new one. */
  board?: Pick<BoardSummary, "id" | "name" | "description">;
  onSaved?: (board: BoardSummary) => void;
}

export function BoardFormModal(props: BoardFormModalProps) {
  // Remount the form whenever it is opened so its fields always start from the current board.
  return props.open ? <BoardForm {...props} /> : null;
}

function BoardForm({ onClose, board, onSaved }: BoardFormModalProps) {
  const create = useCreateBoard();
  const update = useUpdateBoard(board?.id ?? "");
  const mutation = board ? update : create;

  const [name, setName] = useState(board?.name ?? "");
  const [description, setDescription] = useState(board?.description ?? "");

  const error = mutation.isError ? parseApiError(mutation.error) : null;
  const fields = error?.fields ?? {};
  const formLevel = error && !fields.name && !fields.description;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(
      { name, description },
      {
        onSuccess: (saved) => {
          onSaved?.(saved);
          onClose();
        },
      },
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={board ? "Editar quadro" : "Novo quadro"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="board-form" loading={mutation.isPending}>
            {board ? "Salvar" : "Criar quadro"}
          </Button>
        </>
      }
    >
      <form id="board-form" onSubmit={onSubmit} noValidate className="space-y-4">
        {formLevel && <Alert>{error.message}</Alert>}
        <TextField
          label="Nome"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fields.name}
          maxLength={100}
          autoFocus
        />
        <TextArea
          label="Descrição (opcional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          error={fields.description}
          maxLength={500}
          rows={3}
        />
      </form>
    </Modal>
  );
}
