"use client";

import { ArrowDownWideNarrow, ListFilter } from "lucide-react";
import { cardsInBoardText } from "@/lib/format";
import { EMPTY_FILTERS, isFilterActive, toggleLabelFilter, type BoardFilters } from "@/lib/filters";
import { LABEL_STYLES } from "@/lib/palette";
import type { Label } from "@/lib/types";

interface BoardFiltersProps {
  labels: Label[];
  filters: BoardFilters;
  onChange: (next: BoardFilters) => void;
  cardCount: number;
  sortByDue: boolean;
  onToggleSort: () => void;
}

function Chip({
  selected,
  onClick,
  dotClass,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  dotClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-[34px] max-w-48 items-center gap-2 rounded-full border px-[15px] text-[15px] ${
        selected ? "border-ink bg-ink font-medium text-white" : "border-border bg-surface text-body hover:bg-surface-alt"
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span className="truncate">{children}</span>
    </button>
  );
}

/** Barra de filtros do protótipo. Filtro é só visualização, individual e em memória (RN-28). */
export function BoardFiltersBar({
  labels,
  filters,
  onChange,
  cardCount,
  sortByDue,
  onToggleSort,
}: BoardFiltersProps) {
  const active = isFilterActive(filters);

  return (
    <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-3 border-b border-border bg-filter-bar px-8 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2.5 pr-2.5 text-[15px] text-muted">
          <ListFilter size={14} aria-hidden />
          Filtrar por etiqueta
        </span>
        <Chip selected={!active} onClick={() => onChange(EMPTY_FILTERS)} dotClass="bg-[#8a93a5]">
          Todas
        </Chip>
        {labels.map((label) => (
          <Chip
            key={label.id}
            selected={filters.labelIds.includes(label.id)}
            onClick={() => onChange(toggleLabelFilter(filters, label.id))}
            dotClass={LABEL_STYLES[label.color].dot}
          >
            {label.name}
          </Chip>
        ))}
        <Chip
          selected={filters.overdueOnly}
          onClick={() => onChange({ ...filters, overdueOnly: !filters.overdueOnly })}
          dotClass="bg-red"
        >
          Atrasados
        </Chip>
        {labels.length === 0 ? (
          <span className="text-[13.5px] text-placeholder">Este quadro ainda não tem etiquetas.</span>
        ) : null}
        {active ? (
          <span className="rounded-full bg-blue-bg px-2.5 py-0.5 text-[13px] font-medium text-blue">
            Filtro ativo
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[14.5px] text-muted">{cardsInBoardText(cardCount)}</span>
        <button
          type="button"
          aria-pressed={sortByDue}
          onClick={onToggleSort}
          className={`flex h-9 items-center gap-[9px] rounded-lg border px-[15px] text-[15px] ${
            sortByDue ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:bg-surface-alt"
          }`}
        >
          <ArrowDownWideNarrow size={14} aria-hidden />
          Ordenar por prazo
        </button>
      </div>
    </div>
  );
}
