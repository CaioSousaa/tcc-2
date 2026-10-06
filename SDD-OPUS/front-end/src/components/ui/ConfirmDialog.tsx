"use client";

import { TriangleAlert } from "lucide-react";
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
      width="max-w-[506px]"
      icon={
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-danger-bg text-danger">
          <TriangleAlert size={18} aria-hidden="true" />
        </span>
      }
      subtitle={<div className="space-y-3">{children}</div>}
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
      {error && <Alert>{error}</Alert>}
    </Modal>
  );
}
