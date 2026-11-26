"use client";

import { TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Dialog, ModalBody, ModalFooter } from "./Dialog";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** Confirmação explícita para ações destrutivas, no formato do modal "Excluir lista" do protótipo. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirmar",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} label={title} widthClass="w-[506px]">
      <ModalBody>
        <div className="flex gap-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg text-red">
            <TriangleAlert size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-xl font-bold tracking-[-0.2px] text-ink">{title}</h2>
            <div className="text-[15px] leading-normal text-muted">{children}</div>
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalBody>
    </Dialog>
  );
}
