"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { ListWithCards } from "@/lib/types";

export function NewListModal({
  boardId,
  onClose,
  onCreated,
}: {
  boardId: string;
  onClose: () => void;
  onCreated: (list: ListWithCards) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<ListWithCards>(`/boards/${boardId}/lists`, { name });
      onCreated(data);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title="Criar nova lista" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4 p-5">
        <Field
          label="Nome da lista"
          autoFocus
          maxLength={100}
          placeholder="Ex.: Em progresso"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            Criar lista
          </Button>
        </div>
      </form>
    </Modal>
  );
}
