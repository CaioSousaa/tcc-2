"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "./Button";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 462,
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  padded?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#1A1F2C8F]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex min-h-full items-center justify-center p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          style={{ maxWidth: width }}
          className={`flex w-full flex-col rounded-2xl bg-surface shadow-[0_24px_64px_#00000040] ${
            padded ? "gap-5 p-[26px]" : "overflow-hidden"
          }`}
        >
          {title && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] font-bold tracking-[-0.3px] text-ink">{title}</h2>
                <IconButton onClick={onClose} aria-label="Fechar">
                  <X size={13} />
                </IconButton>
              </div>
              {subtitle && <p className="text-[15px] leading-[23px] text-muted">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2.5 pt-1.5">{children}</div>;
}
