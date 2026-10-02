"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Tailwind max-width class for the panel. */
  width?: string;
  footer?: ReactNode;
}

/**
 * Accessible modal built on the native <dialog>: focus is trapped, the page behind is inert
 * and Esc closes it (plan §6.5). Dialogs opened on top of each other stack correctly.
 */
export function Modal({ open, onClose, title, children, width = "max-w-lg", footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={() => onCloseRef.current()}
      onMouseDown={(event) => {
        // Click on the backdrop (the dialog element itself) dismisses.
        if (event.target === event.currentTarget) onCloseRef.current();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-xl bg-white p-0 text-slate-900 shadow-xl`}
    >
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Fechar"
            className="rounded p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            ✕
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
