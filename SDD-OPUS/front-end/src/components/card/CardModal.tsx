"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { DueBadge, LabelChip } from "@/components/board/CardView";
import { Alert } from "@/components/ui/Alert";
import { Button, IconButton } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EditableText } from "@/components/ui/EditableText";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage, parseApiError } from "@/lib/api";
import { useMoveCard } from "@/lib/board";
import {
  useCardDetail,
  useDeleteCard,
  useToggleAssignee,
  useToggleCardLabel,
  useUpdateCard,
  type CardPatch,
} from "@/lib/card";
import { queryKeys } from "@/lib/queryKeys";
import type { BoardDetail, CardDetail } from "@/lib/types";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";

interface CardModalProps {
  board: BoardDetail;
  cardId: string;
  today: string;
  canEdit: boolean;
  onClose: () => void;
  onManageLabels: () => void;
}

export function CardModal({ board, cardId, today, canEdit, onClose, onManageLabels }: CardModalProps) {
  const card = useCardDetail(cardId);
  const notFound = card.isError && parseApiError(card.error).status === 404;

  return (
    <Modal open onClose={onClose} title={card.data?.title ?? "Card"} width="max-w-[880px]" bare>
      {card.data ? (
        <CardEditor
          board={board}
          card={card.data}
          today={today}
          canEdit={canEdit}
          onClose={onClose}
          onManageLabels={onManageLabels}
        />
      ) : (
        <div className="flex flex-col gap-4 p-[26px]">
          <div className="flex justify-end">
            <IconButton label="Fechar" onClick={onClose}>
              <X size={13} aria-hidden="true" />
            </IconButton>
          </div>
          {card.isPending && <Spinner />}
          {notFound && <Alert>Este card não existe mais. Ele pode ter sido excluído por outra pessoa.</Alert>}
          {card.isError && !notFound && <Alert>{errorMessage(card.error)}</Alert>}
        </div>
      )}
    </Modal>
  );
}

/**
 * Native date input committed after a short pause (or on blur), because typing a date passes
 * through transient valid values (e.g. year "0002") that must not be sent to the server.
 * Clearing the field does nothing: removing the deadline is the explicit "Remover prazo" button.
 */
function DueDateField({
  value,
  disabled,
  onCommit,
}: {
  value: string | null;
  disabled: boolean;
  onCommit: (dueDate: string) => void;
}) {
  const timer = useRef<number | null>(null);
  const latest = useRef(value ?? "");

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  function commit() {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    if (latest.current !== "" && latest.current !== (value ?? "")) onCommit(latest.current);
  }

  return (
    <input
      id="card-due"
      type="date"
      defaultValue={value ?? ""}
      disabled={disabled}
      onChange={(event) => {
        latest.current = event.target.value;
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(commit, 700);
      }}
      onBlur={commit}
      className="h-10 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none focus:border-navy disabled:bg-surface-alt disabled:text-muted"
    />
  );
}

function SideField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[9px]">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-muted">
          {label}
        </label>
      ) : (
        <h3 className="text-[13px] font-medium text-muted">{label}</h3>
      )}
      {children}
    </div>
  );
}

interface CardEditorProps {
  board: BoardDetail;
  card: CardDetail;
  today: string;
  canEdit: boolean;
  onClose: () => void;
  onManageLabels: () => void;
}

function CardEditor({ board, card, today, canEdit, onClose, onManageLabels }: CardEditorProps) {
  const queryClient = useQueryClient();
  const updateCard = useUpdateCard(board.id, card.id);
  const deleteCard = useDeleteCard(board.id);
  const moveCard = useMoveCard(board.id);
  const toggleLabel = useToggleCardLabel(board.id, card.id);
  const toggleAssignee = useToggleAssignee(board.id, card.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const list = board.lists.find((l) => l.id === card.listId);
  const update = (patch: CardPatch) => updateCard.mutate(patch);

  function moveToList(listId: string) {
    const target = board.lists.find((l) => l.id === listId);
    if (!target || listId === card.listId) return;
    // Goes to the end of the destination list (position = its current card count).
    moveCard.mutate(
      { cardId: card.id, listId, position: target.cards.length },
      { onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.card(card.id) }) },
    );
  }

  const updateError = updateCard.isError ? parseApiError(updateCard.error) : null;
  const sideError = [toggleLabel, toggleAssignee, moveCard].find((m) => m.isError);

  return (
    <>
      <header className="flex items-start justify-between gap-4 border-b border-line px-[26px] pt-6 pb-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="px-2 font-mono text-[11px] tracking-[1.6px] text-muted uppercase">
            Card · {list?.name ?? "—"}
          </span>
          <EditableText
            key={card.title}
            label="Título do card"
            value={card.title}
            maxLength={200}
            disabled={!canEdit}
            className="text-[22px] font-bold tracking-[-0.3px] text-ink"
            onSave={(title) => update({ title })}
          />
        </div>
        <IconButton label="Fechar" onClick={onClose}>
          <X size={13} aria-hidden="true" />
        </IconButton>
      </header>

      {(updateError || sideError) && (
        <div className="space-y-2 px-[26px] pt-4">
          {updateError && (
            <Alert>
              {updateError.fields.title ?? updateError.fields.description ?? updateError.fields.dueDate ?? updateError.message}
            </Alert>
          )}
          {sideError && <Alert>{errorMessage(sideError.error)}</Alert>}
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-[26px]">
          <section className="flex flex-col gap-2">
            <h3 className="text-[13.5px] font-medium text-body">Descrição</h3>
            <EditableText
              key={card.description ?? ""}
              label="Descrição do card"
              value={card.description ?? ""}
              maxLength={5000}
              multiline
              boxed
              rows={3}
              disabled={!canEdit}
              placeholder={canEdit ? "Adicione uma descrição mais detalhada…" : "Sem descrição."}
              className="text-[15px] leading-[23px] text-ink"
              onSave={(description) => update({ description })}
            />
          </section>

          <ChecklistSection
            boardId={board.id}
            cardId={card.id}
            checklists={card.checklists}
            checked={card.checklistChecked}
            total={card.checklistTotal}
            canEdit={canEdit}
          />

          <CommentsSection cardId={card.id} canComment={canEdit} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-[22px] border-t border-line bg-surface-alt p-[22px] md:w-[305px] md:border-t-0 md:border-l">
          <SideField label="Lista" htmlFor="card-list">
            <div className="relative">
              <select
                id="card-list"
                value={card.listId}
                disabled={!canEdit || moveCard.isPending}
                onChange={(event) => moveToList(event.target.value)}
                className="h-10 w-full appearance-none rounded-lg border border-line bg-surface-alt pr-9 pl-4 text-[15px] text-ink outline-none focus:border-navy disabled:opacity-60"
              >
                {board.lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink"
              />
            </div>
          </SideField>

          <label className="flex items-center gap-3 text-[15px] text-ink">
            <input
              type="checkbox"
              checked={card.completed}
              disabled={!canEdit}
              onChange={(event) => update({ completed: event.target.checked })}
              className="size-5 rounded-[5px] accent-navy"
            />
            Marcar como concluído
          </label>

          <SideField label="Etiquetas">
            {board.labels.length === 0 ? (
              <p className="text-[13.5px] text-muted">O quadro ainda não tem etiquetas.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {board.labels.map((label) => {
                  const applied = card.labelIds.includes(label.id);
                  return (
                    <li key={label.id}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={applied}
                        disabled={!canEdit}
                        onClick={() => toggleLabel.mutate({ labelId: label.id, apply: !applied })}
                        className={`rounded-md transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy disabled:cursor-default ${
                          applied ? "ring-2 ring-ink ring-offset-1 ring-offset-surface-alt" : "opacity-50 hover:opacity-100"
                        }`}
                      >
                        <LabelChip label={label} large />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {canEdit && (
              <Button variant="secondary" size="sm" onClick={onManageLabels} className="h-[34px] self-start px-3 text-[13.5px] font-normal">
                Gerenciar etiquetas
              </Button>
            )}
          </SideField>

          <SideField label="Responsáveis">
            <ul className="flex flex-col gap-1.5">
              {board.members.map((member) => {
                const assigned = card.assigneeIds.includes(member.userId);
                return (
                  <li key={member.userId}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={assigned}
                      disabled={!canEdit}
                      onClick={() => toggleAssignee.mutate({ userId: member.userId, assign: !assigned })}
                      className={`flex w-full items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left text-sm transition disabled:cursor-default ${
                        assigned ? "border-navy bg-surface text-ink" : "border-transparent text-muted hover:bg-surface"
                      }`}
                    >
                      <Avatar name={member.name} seed={member.userId} size="md" ring={false} />
                      <span className="min-w-0 flex-1 truncate">{member.name}</span>
                      {assigned && <Check size={14} aria-hidden="true" className="text-navy" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </SideField>

          <SideField label="Prazo" htmlFor="card-due">
            <DueDateField
              key={card.dueDate ?? "none"}
              value={card.dueDate}
              disabled={!canEdit}
              onCommit={(dueDate) => update({ dueDate })}
            />
            {card.dueDate ? (
              <DueBadge dueDate={card.dueDate} completed={card.completed} today={today} wide />
            ) : (
              <p className="text-[13px] text-muted">Sem prazo definido.</p>
            )}
            {canEdit && card.dueDate && (
              <Button variant="ghost" size="sm" onClick={() => update({ dueDate: null })} className="h-8 self-start px-2 text-[13.5px]">
                Remover prazo
              </Button>
            )}
          </SideField>

          {canEdit && (
            <>
              <div className="flex-1" />
              <Button variant="danger-outline" onClick={() => setConfirmDelete(true)} className="h-10 w-full">
                Excluir card
              </Button>
            </>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir card"
        confirmLabel="Excluir card"
        loading={deleteCard.isPending}
        error={deleteCard.isError ? errorMessage(deleteCard.error) : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteCard.mutate(card.id, { onSuccess: onClose })}
      >
        <p>
          O card <strong className="text-ink">{card.title}</strong> será excluído permanentemente, junto com suas
          checklists, comentários, etiquetas e responsáveis.
        </p>
      </ConfirmDialog>
    </>
  );
}
