"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { errorMessage } from "@/lib/api";
import { Button } from "./Button";
import { FormError } from "./Field";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({ title, description, confirmLabel = "Excluir", onConfirm, onClose }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} width={480}>
      <div className="flex gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg text-red">
          <TriangleAlert size={18} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <p className="text-[15px] text-muted">{description}</p>
        </div>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2.5 pt-1.5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" loading={loading} onClick={confirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
