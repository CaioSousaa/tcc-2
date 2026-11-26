"use client";

import { ListFilter } from "lucide-react";
import { plural } from "@/lib/format";
import type { BoardDetail } from "@/lib/types";

export interface BoardFilters {
  labelIds: string[];
  overdue: boolean;
}

interface FilterBarProps {
  board: BoardDetail;
  filters: BoardFilters;
  onChange: (filters: BoardFilters) => void;
}

function Chip({
  active,
  dot,
  children,
  onClick,
}: {
  active: boolean;
  dot: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-[34px] items-center gap-2 rounded-full border px-[15px] text-[15px] transition-colors ${
        active ? "border-ink bg-ink font-medium text-white" : "border-border bg-white text-body hover:bg-surface-alt"
      }`}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
      {children}
    </button>
  );
}

export function FilterBar({ board, filters, onChange }: FilterBarProps) {
  const active = filters.labelIds.length > 0 || filters.overdue;

  const toggleLabel = (id: string) =>
    onChange({
      ...filters,
      labelIds: filters.labelIds.includes(id)
        ? filters.labelIds.filter((labelId) => labelId !== id)
        : [...filters.labelIds, id],
    });

  return (
    <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-3 border-b border-border bg-filter-bar px-6 py-3 md:pl-[30px] md:pr-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2.5 pr-2.5 text-[15px] text-muted">
          <ListFilter size={14} /> Filtrar por etiqueta
        </span>
        <Chip active={filters.labelIds.length === 0} dot="#8A93A5" onClick={() => onChange({ ...filters, labelIds: [] })}>
          Todas
        </Chip>
        {board.labels.map((label) => (
          <Chip
            key={label.id}
            active={filters.labelIds.includes(label.id)}
            dot={label.color}
            onClick={() => toggleLabel(label.id)}
          >
            {label.name}
          </Chip>
        ))}
        <span className="mx-1.5 h-6 w-px bg-border" />
        <Chip active={filters.overdue} dot="#C8423A" onClick={() => onChange({ ...filters, overdue: !filters.overdue })}>
          Atrasados
        </Chip>
      </div>
      <span className="text-[14.5px] text-muted">
        {active
          ? `${board.visibleCardCount} de ${plural(board.cardCount, "card", "cards")} visíveis`
          : `${plural(board.cardCount, "card", "cards")} no quadro`}
      </span>
    </div>
  );
}
