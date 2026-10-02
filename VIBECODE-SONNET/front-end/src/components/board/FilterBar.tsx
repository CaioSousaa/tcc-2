"use client";

import { ArrowDownWideNarrow, Clock3, ListFilter } from "lucide-react";
import type { Label } from "@/lib/types";

interface FilterBarProps {
  labels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  onClearLabels: () => void;
  overdueOnly: boolean;
  overdueCount: number;
  onToggleOverdue: () => void;
  visibleCount: number;
  totalCount: number;
  sortByDue: boolean;
  onToggleSort: () => void;
}

function Chip({
  active,
  dot,
  children,
  onClick,
  tone = "default",
}: {
  active: boolean;
  dot?: string;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  const activeClass = tone === "danger" ? "border-red bg-red text-white" : "border-ink bg-ink text-white";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-[34px] shrink-0 items-center gap-2 rounded-full border px-[15px] text-[15px] transition-colors ${
        active ? `${activeClass} font-medium` : "border-border bg-surface text-body hover:border-muted"
      }`}
    >
      {dot && <span className="size-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}

export function FilterBar({
  labels,
  selectedLabelIds,
  onToggleLabel,
  onClearLabels,
  overdueOnly,
  overdueCount,
  onToggleOverdue,
  visibleCount,
  totalCount,
  sortByDue,
  onToggleSort,
}: FilterBarProps) {
  const filtered = visibleCount !== totalCount;
  return (
    <div className="flex min-h-[65px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-[#FBFBFD] py-3 pl-[30px] pr-8">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="flex items-center gap-2.5 pr-2.5 text-[15px] text-muted">
          <ListFilter className="size-3.5" />
          Filtrar por etiqueta
        </span>
        <Chip active={selectedLabelIds.length === 0} dot="#8A93A5" onClick={onClearLabels}>
          Todas
        </Chip>
        {labels.map((label) => (
          <Chip
            key={label.id}
            active={selectedLabelIds.includes(label.id)}
            dot={label.color}
            onClick={() => onToggleLabel(label.id)}
          >
            {label.name || "Sem nome"}
          </Chip>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <Chip active={overdueOnly} tone="danger" onClick={onToggleOverdue}>
          <Clock3 className="size-3.5" />
          Atrasados
          <span className={`font-mono text-xs ${overdueOnly ? "text-white/80" : "text-red"}`}>{overdueCount}</span>
        </Chip>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[14.5px] text-muted">
          {filtered ? `${visibleCount} de ${totalCount} cards` : `${totalCount} ${totalCount === 1 ? "card" : "cards"} no quadro`}
        </span>
        <button
          type="button"
          aria-pressed={sortByDue}
          onClick={onToggleSort}
          className={`flex h-9 items-center gap-[9px] rounded-lg border px-[15px] text-[15px] transition-colors ${
            sortByDue ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:bg-surface-alt"
          }`}
        >
          <ArrowDownWideNarrow className="size-3.5" />
          Ordenar por prazo
        </button>
      </div>
    </div>
  );
}
