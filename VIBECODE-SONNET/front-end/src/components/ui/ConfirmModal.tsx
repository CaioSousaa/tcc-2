"use client";

import { TriangleAlert } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  loading,
  error,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} width={480}>
      <div className="flex gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg">
          <TriangleAlert className="size-[18px] text-red" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-[-0.2px] text-ink">{title}</h2>
          <div className="text-[15px] leading-[1.5] text-muted">{description}</div>
        </div>
      </div>
      {error && <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>}
      <div className="flex justify-end gap-2.5 pt-1.5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
