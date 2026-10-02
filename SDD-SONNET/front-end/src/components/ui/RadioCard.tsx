import type { ReactNode } from "react";

/** Opção com rádio em cartão, como no modal "Excluir lista" do protótipo. */
export function RadioCard({
  checked,
  onSelect,
  title,
  description,
  name,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  name: string;
  children?: ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3.5 rounded-[10px] border bg-surface px-[18px] py-4 ${
        checked ? "border-navy" : "border-border"
      }`}
    >
      <span className="relative mt-0.5 inline-flex h-[18px] w-[18px] shrink-0">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onSelect}
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          aria-hidden
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] bg-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-navy ${
            checked ? "border-navy" : "border-check-border"
          }`}
        >
          {checked ? <span className="h-[9px] w-[9px] rounded-full bg-navy" /> : null}
        </span>
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-[15.5px] font-medium text-ink">{title}</span>
        <span className="block text-[13.5px] leading-snug text-muted">{description}</span>
        {children}
      </span>
    </label>
  );
}
