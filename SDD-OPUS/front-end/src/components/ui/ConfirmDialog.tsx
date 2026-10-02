"use client";

import type { ReactNode } from "react";
import { Alert } from "./Alert";
import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

/** Explicit confirmation for destructive actions (RN-X8). Cancel changes nothing. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  loading = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-slate-700">
        {children}
        {error && <Alert>{error}</Alert>}
      </div>
    </Modal>
  );
}
