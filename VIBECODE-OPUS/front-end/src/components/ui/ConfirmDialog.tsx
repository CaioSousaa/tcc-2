"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  loading,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} width={480} bare>
      <div className="p-[26px]">
        <div className="flex gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-bg text-red">
            <TriangleAlert size={18} />
          </span>
          <div>
            <h2 className="text-[20px] font-bold text-ink">{title}</h2>
            <div className="mt-2 text-[15px] leading-relaxed text-muted">{description}</div>
          </div>
        </div>
        <div className="mt-7 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
