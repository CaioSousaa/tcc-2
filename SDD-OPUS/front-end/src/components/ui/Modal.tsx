"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Short explanatory text under the title. */
  subtitle?: ReactNode;
  /** Visual shown to the left of the title (e.g. a warning badge). */
  icon?: ReactNode;
  /** Tailwind max-width class for the panel. */
  width?: string;
  footer?: ReactNode;
  /** Renders children edge to edge, without the standard header and padding. */
  bare?: boolean;
}

/**
 * Accessible modal built on the native <dialog>: focus is trapped, the page behind is inert
 * and Esc closes it (plan §6.5). Dialogs opened on top of each other stack correctly.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  subtitle,
  icon,
  width = "max-w-[462px]",
  footer,
  bare = false,
}: ModalProps) {
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
      className={`m-auto w-[calc(100%-2rem)] ${width} overflow-hidden rounded-2xl bg-surface p-0 text-ink shadow-modal`}
    >
      {bare ? (
        <div className="max-h-[90vh] overflow-y-auto">{children}</div>
      ) : (
        <div className="flex max-h-[90vh] flex-col gap-5 overflow-y-auto p-[26px]">
          <header className="flex gap-3.5">
            {icon}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <h2 className={`min-w-0 break-words font-bold text-ink ${icon ? "text-xl tracking-[-0.2px]" : "text-[22px] tracking-[-0.3px]"}`}>
                  {title}
                </h2>
                {!icon && <IconButton label="Fechar" size={30} onClick={() => onCloseRef.current()}><X size={13} /></IconButton>}
              </div>
              {subtitle && <div className="text-[15px] leading-[23px] text-muted">{subtitle}</div>}
            </div>
          </header>
          <div>{children}</div>
          {footer && <footer className="flex justify-end gap-2.5 pt-1.5">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
