"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { errorMessage, parseApiError } from "@/lib/api";
import { useDeleteList, useRenameList } from "@/lib/board";
import type { BoardList, CardSummary, Label, Member } from "@/lib/types";
import { AddCardForm } from "./AddCardForm";
import { SortableCard } from "./SortableCard";

interface ListColumnProps {
  boardId: string;
  list: BoardList;
  /** Cards that pass the current view filter, in list order. */
  visibleCards: CardSummary[];
  filterActive: boolean;
  labelsById: ReadonlyMap<string, Label>;
  membersById: ReadonlyMap<string, Member>;
  today: string;
  canEdit: boolean;
  onOpenCard: (cardId: string) => void;
  onCardCreated: () => void;
}

export const listSortableId = (listId: string) => `list:${listId}`;

export function ListColumn({
  boardId,
  list,
  visibleCards,
  filterActive,
  labelsById,
  membersById,
  today,
  canEdit,
  onOpenCard,
  onCardCreated,
}: ListColumnProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: listSortableId(list.id), data: { type: "list", listId: list.id }, disabled: !canEdit });

  const renameList = useRenameList(boardId);
  const deleteList = useDeleteList(boardId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(list.name);
  const [actionError, setActionError] = useState<string | null>(null);
  // Number of cards the user is being asked to confirm deleting; null = no dialog (RF05).
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [staleCount, setStaleCount] = useState(false);

  function startRename() {
    setMenuOpen(false);
    setDraft(list.name);
    setActionError(null);
    renameList.reset();
    setRenaming(true);
  }

  function submitRename() {
    const name = draft.trim();
    if (name === list.name) {
      setRenaming(false);
      return;
    }
    renameList.mutate(
      { listId: list.id, name: draft },
      { onSuccess: () => setRenaming(false) },
    );
  }

  /** Empty lists are deleted directly; lists with cards ask for explicit confirmation. */
  async function requestDelete() {
    setMenuOpen(false);
    setActionError(null);
    setStaleCount(false);
    if (list.cards.length > 0) {
      setConfirmCount(list.cards.length);
      return;
    }
    try {
      await deleteList.mutateAsync({ listId: list.id, confirmCards: 0 });
    } catch (error) {
      const info = parseApiError(error);
      // Someone added cards meanwhile: fall back to the confirmation dialog (CA-L6).
      if (info.code === "LIST_NOT_EMPTY") setConfirmCount(Number(info.details?.cardCount ?? 0));
      else setActionError(info.message);
    }
  }

  async function confirmDelete() {
    if (confirmCount === null) return;
    try {
      await deleteList.mutateAsync({ listId: list.id, confirmCards: confirmCount });
      setConfirmCount(null);
    } catch (error) {
      const info = parseApiError(error);
      if (info.code === "LIST_NOT_EMPTY") {
        // The list changed while the dialog was open: ask again with the real number.
        setConfirmCount(Number(info.details?.cardCount ?? 0));
        setStaleCount(true);
      } else {
        setActionError(info.message);
        setConfirmCount(null);
      }
    }
  }

  const hiddenCount = list.cards.length - visibleCards.length;

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      aria-label={`Lista ${list.name}`}
      className={`flex max-h-full w-72 shrink-0 flex-col rounded-xl bg-slate-100 ring-1 ring-slate-200 ${isDragging ? "opacity-50" : ""}`}
    >
      <header className="flex items-start gap-1 px-2 pb-1 pt-2">
        {canEdit && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Mover lista ${list.name}`}
            className="mt-0.5 cursor-grab rounded px-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-indigo-600"
            {...attributes}
            {...listeners}
          >
            ⠿
          </button>
        )}

        {renaming ? (
          <input
            aria-label="Nome da lista"
            autoFocus
            value={draft}
            maxLength={100}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={submitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") setRenaming(false);
            }}
            className="min-w-0 flex-1 rounded border-0 bg-white px-1.5 py-0.5 text-sm font-semibold ring-1 ring-inset ring-indigo-500"
          />
        ) : (
          <h3 className="min-w-0 flex-1 break-words px-1 py-0.5 text-sm font-semibold text-slate-800">
            {list.name}
            <span className="ml-1.5 text-xs font-normal text-slate-500">{list.cards.length}</span>
          </h3>
        )}

        {canEdit && (
          <div className="relative">
            <button
              type="button"
              aria-label={`Ações da lista ${list.name}`}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-1 w-40 rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-slate-200"
              >
                <button role="menuitem" type="button" onClick={startRename} className="block w-full px-3 py-1.5 text-left hover:bg-slate-100">
                  Renomear
                </button>
                <button role="menuitem" type="button" onClick={requestDelete} className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50">
                  Excluir lista
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {(renameList.isError || actionError) && (
        <div className="px-2 pb-1">
          <Alert>{actionError ?? errorMessage(renameList.error)}</Alert>
        </div>
      )}

      <SortableContext items={visibleCards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex min-h-12 flex-col gap-2 overflow-y-auto px-2 py-1">
          {visibleCards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              listId={list.id}
              labelsById={labelsById}
              membersById={membersById}
              today={today}
              canMove={canEdit}
              onOpen={onOpenCard}
            />
          ))}
        </ul>
      </SortableContext>

      {list.cards.length === 0 && (
        <p className="px-3 pb-1 text-xs text-slate-500">Nenhum card nesta lista.</p>
      )}
      {filterActive && hiddenCount > 0 && (
        <p className="px-3 pb-1 text-xs text-slate-500">
          {visibleCards.length === 0
            ? "Nenhum card corresponde ao filtro."
            : `${hiddenCount} card(s) oculto(s) pelo filtro.`}
        </p>
      )}

      {canEdit && (
        <div className="p-2">
          <AddCardForm boardId={boardId} listId={list.id} onCreated={onCardCreated} />
        </div>
      )}

      <ConfirmDialog
        open={confirmCount !== null}
        title="Excluir lista"
        confirmLabel={`Excluir lista e ${confirmCount ?? 0} card(s)`}
        loading={deleteList.isPending}
        onCancel={() => setConfirmCount(null)}
        onConfirm={confirmDelete}
      >
        {staleCount && (
          <Alert tone="info">A lista foi alterada por outra pessoa. Confira a quantidade e confirme novamente.</Alert>
        )}
        <p>
          A lista <strong>{list.name}</strong> contém <strong>{confirmCount ?? 0} card(s)</strong>. Ao
          confirmar, a lista <strong>e todos esses cards</strong> — com checklists, comentários,
          responsáveis e prazos — serão excluídos permanentemente.
        </p>
        <p>Os cards não serão movidos para outra lista. Esta ação não pode ser desfeita.</p>
      </ConfirmDialog>
    </section>
  );
}
