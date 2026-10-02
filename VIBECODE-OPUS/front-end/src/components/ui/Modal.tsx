"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Open modals, innermost last: only the top one reacts to Escape. */
const modalStack: string[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  /** Renders children without the default padded header/body layout. */
  bare?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  width = 460,
  children,
  bare = false,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    modalStack.push(titleId);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && modalStack[modalStack.length - 1] === titleId) {
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      modalStack.splice(modalStack.indexOf(titleId), 1);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, titleId]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1F2C]/55 px-4 py-10 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="w-full rounded-2xl bg-surface shadow-2xl outline-none"
        style={{ maxWidth: width }}
      >
        {bare ? (
          children
        ) : (
          <div className="p-[26px]">
            {title && (
              <div className="flex items-start justify-between gap-4">
                <h2 id={titleId} className="text-[22px] font-bold text-ink">
                  {title}
                </h2>
                <CloseButton onClick={onClose} />
              </div>
            )}
            {description && (
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                {description}
              </p>
            )}
            <div className={title || description ? "mt-5" : ""}>{children}</div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Fechar"
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition hover:bg-surface-alt hover:text-ink"
    >
      <X size={15} />
    </button>
  );
}
