"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { IconButton } from "./Button";

export function Modal({
  title,
  onClose,
  children,
  width = "max-w-md",
}: {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} rounded-xl bg-surface shadow-xl`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <IconButton onClick={onClose} aria-label="Fechar">
              <X size={16} />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
