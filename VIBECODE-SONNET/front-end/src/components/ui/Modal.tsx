"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

/** Pilha de modais abertos: Esc fecha apenas o que está no topo. */
const modalStack: string[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Modal sem cabeçalho/padding padrão (ex.: detalhe do card). */
  bare?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  width = 462,
  children,
  footer,
  bare,
}: ModalProps) {
  const id = useId();

  useEffect(() => {
    if (!open) return;
    modalStack.push(id);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalStack[modalStack.length - 1] === id) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      const index = modalStack.lastIndexOf(id);
      if (index >= 0) modalStack.splice(index, 1);
    };
  }, [open, onClose, id]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1F2C8F] p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[calc(100vh-32px)] w-full flex-col rounded-2xl bg-surface shadow-[0_24px_64px_rgba(0,0,0,0.25)] ${
          bare ? "overflow-hidden" : "gap-5 overflow-y-auto p-[26px]"
        }`}
        style={{ maxWidth: width }}
      >
        {bare ? (
          children
        ) : (
          <>
            {(title || subtitle) && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-[22px] font-bold tracking-[-0.3px] text-ink">{title}</h2>
                  <IconButton icon={X} label="Fechar" onClick={onClose} />
                </div>
                {subtitle && <p className="text-[15px] leading-[1.5] text-muted">{subtitle}</p>}
              </div>
            )}
            {children}
            {footer && <div className="flex justify-end gap-2.5 pt-1.5">{footer}</div>}
          </>
        )}
      </div>
    </div>
  );
}
