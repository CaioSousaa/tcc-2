"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "./Button";

interface ModalProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  width?: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Remove o cabeçalho e o padding padrão (o conteúdo monta o próprio layout) */
  bare?: boolean;
}

export function Modal({ title, subtitle, onClose, width = 462, children, footer, bare = false }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1A1F2C]/45 px-4 py-10"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full rounded-2xl bg-white shadow-xl ${bare ? "" : "flex flex-col gap-5 p-[26px]"}`}
        style={{ maxWidth: width }}
      >
        {!bare && (
          <>
            {title && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-[22px] font-bold text-ink">{title}</h2>
                  <IconButton label="Fechar" onClick={onClose}>
                    <X size={14} />
                  </IconButton>
                </div>
                {subtitle && <p className="text-[15px] text-muted">{subtitle}</p>}
              </div>
            )}
            {children}
            {footer && <div className="flex justify-end gap-2.5 pt-1.5">{footer}</div>}
          </>
        )}
        {bare && children}
      </div>
    </div>
  );
}
