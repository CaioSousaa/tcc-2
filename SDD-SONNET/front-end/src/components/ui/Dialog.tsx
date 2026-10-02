"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Nome acessível do diálogo. */
  label: string;
  /** Largura do modal, como no protótipo (ex.: `w-[462px]`). */
  widthClass?: string;
  children: ReactNode;
}

/** Modal sobre o `<dialog>` nativo (foco preso, Esc fecha). Sobreposição `#1A1F2C8F`. */
export function Dialog({ open, onClose, label, widthClass = "w-[462px]", children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto max-w-[calc(100%-2rem)] rounded-2xl bg-surface p-0 text-ink shadow-[0_24px_64px_#00000040] backdrop:bg-overlay ${widthClass}`}
    >
      {open ? <div className="max-h-[90vh] overflow-y-auto rounded-2xl">{children}</div> : null}
    </dialog>
  );
}

/** Cabeçalho padrão dos modais: título 22/700, subtítulo opcional e botão de fechar. */
export function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[22px] font-bold tracking-[-0.3px] text-ink">{title}</h2>
        <IconButton icon={X} label="Fechar" onClick={onClose} />
      </div>
      {subtitle ? <p className="text-[15px] leading-normal text-muted">{subtitle}</p> : null}
    </div>
  );
}

/** Rodapé dos modais: botões à direita. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-2.5 pt-1.5">{children}</div>;
}

/** Corpo padrão dos modais (padding 26, espaçamento 20). */
export function ModalBody({ children }: { children: ReactNode }) {
  return <div className="space-y-5 p-[26px]">{children}</div>;
}
