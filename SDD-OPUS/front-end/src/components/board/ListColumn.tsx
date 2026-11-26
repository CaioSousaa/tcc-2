"use client";

import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { IconButton } from "@/components/ui/Button";
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

  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(list.name);
  const [actionError, setActionError] = useState<string | null>(null);
  // Number of cards the user is being asked to confirm deleting; null = no dialog (RF05).
  const [confirmCount, setConfirmCount] = useState<number | null>(null);
  const [staleCount, setStaleCount] = useState(false);

  function startRename() {
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
      className={`flex max-h-full w-[351px] shrink-0 flex-col gap-3 rounded-[14px] border border-line bg-list p-4 ${isDragging ? "opacity-50" : ""}`}
    >
      <header className="flex items-center gap-2 pb-0.5">
        {canEdit && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            aria-label={`Mover lista ${list.name}`}
            className="-ml-1.5 cursor-grab rounded p-0.5 text-hint hover:bg-chip hover:text-muted focus-visible:outline-2 focus-visible:outline-navy"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={15} aria-hidden="true" />
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
            className="h-[29px] min-w-0 flex-1 rounded-md border border-navy bg-surface px-2 text-[17px] font-bold text-ink outline-none"
          />
        ) : (
          <h3 className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-[17px] font-bold text-ink" title={list.name}>
              {list.name}
            </span>
            <span className="font-mono text-[13px] font-normal text-hint">{list.cards.length}</span>
          </h3>
        )}

        {canEdit && !renaming && (
          <div className="flex gap-[7px]">
            <IconButton label={`Renomear lista ${list.name}`} size={29} onClick={startRename}>
              <Pencil size={13} aria-hidden="true" />
            </IconButton>
            <IconButton label={`Excluir lista ${list.name}`} size={29} onClick={requestDelete}>
              <Trash2 size={13} aria-hidden="true" />
            </IconButton>
          </div>
        )}
      </header>

      {(renameList.isError || actionError) && (
        <div>
          <Alert>{actionError ?? errorMessage(renameList.error)}</Alert>
        </div>
      )}

      <SortableContext items={visibleCards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <ul className="-mx-1 flex min-h-12 flex-col gap-3 overflow-y-auto px-1 py-0.5">
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
        <p className="text-[13.5px] text-muted">Nenhum card nesta lista.</p>
      )}
      {filterActive && hiddenCount > 0 && (
        <p className="text-[13.5px] text-muted">
          {visibleCards.length === 0
            ? "Nenhum card corresponde ao filtro."
            : `${hiddenCount} card(s) oculto(s) pelo filtro.`}
        </p>
      )}

      {canEdit && (
        <div>
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
