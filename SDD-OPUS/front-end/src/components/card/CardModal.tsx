"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { DueBadge } from "@/components/board/CardView";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EditableText } from "@/components/ui/EditableText";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage, parseApiError } from "@/lib/api";
import {
  useCardDetail,
  useDeleteCard,
  useToggleAssignee,
  useToggleCardLabel,
  useUpdateCard,
  type CardPatch,
} from "@/lib/card";
import { labelStyle } from "@/lib/palette";
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
    <Modal open onClose={onClose} title={card.data?.title ?? "Card"} width="max-w-3xl">
      {card.isPending && <Spinner />}
      {notFound && (
        <div className="space-y-3">
          <Alert>Este card não existe mais. Ele pode ter sido excluído por outra pessoa.</Alert>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      )}
      {card.isError && !notFound && <Alert>{errorMessage(card.error)}</Alert>}
      {card.data && (
        <CardEditor
          board={board}
          card={card.data}
          today={today}
          canEdit={canEdit}
          onClose={onClose}
          onManageLabels={onManageLabels}
        />
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
      className="rounded-md border-0 bg-white px-2 py-1 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100"
    />
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
  const updateCard = useUpdateCard(board.id, card.id);
  const deleteCard = useDeleteCard(board.id);
  const toggleLabel = useToggleCardLabel(board.id, card.id);
  const toggleAssignee = useToggleAssignee(board.id, card.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const list = board.lists.find((l) => l.id === card.listId);
  const update = (patch: CardPatch) => updateCard.mutate(patch);

  const updateError = updateCard.isError ? parseApiError(updateCard.error) : null;
  const sideError = [toggleLabel, toggleAssignee].find((m) => m.isError);

  return (
    <div className="space-y-6">
      {updateError && (
        <Alert>{updateError.fields.title ?? updateError.fields.description ?? updateError.fields.dueDate ?? updateError.message}</Alert>
      )}
      {sideError && <Alert>{errorMessage(sideError.error)}</Alert>}

      <div>
        <EditableText
          key={card.title}
          label="Título do card"
          value={card.title}
          maxLength={200}
          disabled={!canEdit}
          className="text-lg font-semibold"
          onSave={(title) => update({ title })}
        />
        <p className="mt-1 px-2 text-xs text-slate-500">
          na lista <strong className="font-medium text-slate-700">{list?.name ?? "—"}</strong>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={card.completed}
              disabled={!canEdit}
              onChange={(event) => update({ completed: event.target.checked })}
              className="size-4 rounded border-slate-300 text-emerald-600"
            />
            Marcar como concluído
          </label>

          <div>
            <label htmlFor="card-due" className="mb-1 block text-sm font-medium text-slate-800">
              Prazo
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <DueDateField
                key={card.dueDate ?? "none"}
                value={card.dueDate}
                disabled={!canEdit}
                onCommit={(dueDate) => update({ dueDate })}
              />
              {canEdit && card.dueDate && (
                <Button variant="ghost" size="sm" onClick={() => update({ dueDate: null })}>
                  Remover prazo
                </Button>
              )}
              {card.dueDate && <DueBadge dueDate={card.dueDate} completed={card.completed} today={today} />}
            </div>
            {!card.dueDate && <p className="mt-1 text-xs text-slate-500">Sem prazo definido.</p>}
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-800">Etiquetas</h3>
            {canEdit && (
              <button type="button" onClick={onManageLabels} className="text-xs font-medium text-indigo-600 hover:underline">
                Gerenciar
              </button>
            )}
          </div>
          {board.labels.length === 0 ? (
            <p className="text-xs text-slate-500">O quadro ainda não tem etiquetas.</p>
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
                      className={`rounded px-2 py-0.5 text-xs font-medium ring-2 ring-inset transition ${labelStyle(label.color).chip} ${applied ? "ring-slate-700" : "ring-transparent opacity-60 hover:opacity-100"} disabled:cursor-default`}
                    >
                      {applied && "✓ "}
                      {label.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-medium text-slate-800">Responsáveis</h3>
        <ul className="flex flex-wrap gap-2">
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
                  className={`flex items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 text-xs ring-1 ring-inset transition disabled:cursor-default ${assigned ? "bg-indigo-50 text-indigo-800 ring-indigo-400" : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50"}`}
                >
                  <Avatar name={member.name} />
                  {member.name}
                  {assigned && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-medium text-slate-800">Descrição</h3>
        <EditableText
          key={card.description ?? ""}
          label="Descrição do card"
          value={card.description ?? ""}
          maxLength={5000}
          multiline
          rows={4}
          disabled={!canEdit}
          placeholder={canEdit ? "Adicione uma descrição mais detalhada…" : "Sem descrição."}
          className="text-sm"
          onSave={(description) => update({ description })}
        />
      </div>

      <ChecklistSection
        boardId={board.id}
        cardId={card.id}
        checklists={card.checklists}
        checked={card.checklistChecked}
        total={card.checklistTotal}
        canEdit={canEdit}
      />

      <CommentsSection cardId={card.id} canComment={canEdit} />

      {canEdit && (
        <div className="border-t border-slate-200 pt-4">
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            Excluir card
          </Button>
        </div>
      )}

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
          O card <strong>{card.title}</strong> será excluído permanentemente, junto com suas
          checklists, comentários, etiquetas e responsáveis.
        </p>
      </ConfirmDialog>
    </div>
  );
}
