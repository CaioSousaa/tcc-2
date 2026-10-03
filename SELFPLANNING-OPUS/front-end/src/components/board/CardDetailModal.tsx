"use client";

import { Plus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormError, inputClass, Select } from "@/components/ui/Field";
import { LabelChip } from "@/components/ui/LabelChip";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { fromDateInput, toDateInput } from "@/lib/format";
import type { BoardDetail, CardDetail, Comment, User } from "@/lib/types";
import { ChecklistBlock } from "./ChecklistBlock";
import { CommentsSection } from "./CommentsSection";
import { DueBadge } from "./DueBadge";
import { LabelsModal } from "./LabelsModal";

interface CardDetailModalProps {
  board: BoardDetail;
  cardId: string;
  currentUser: User;
  onChanged: () => void;
  onClose: () => void;
}

interface Draft {
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
}

const toDraft = (card: CardDetail): Draft => ({
  title: card.title,
  description: card.description ?? "",
  dueDate: toDateInput(card.dueDate),
  completed: card.completed,
});

const sidebarLabel = "text-[13px] font-medium text-muted";

export function CardDetailModal({ board, cardId, currentUser, onChanged, onClose }: CardDetailModalProps) {
  const canEdit = board.role !== "viewer";
  const base = `/boards/${board.id}/cards/${cardId}`;

  const [card, setCard] = useState<CardDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newChecklist, setNewChecklist] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const reload = useCallback(
    async (resetDraft = false) => {
      const [cardResponse, commentsResponse] = await Promise.all([
        api.get<CardDetail>(base),
        api.get<Comment[]>(`${base}/comments`),
      ]);
      setCard(cardResponse.data);
      setComments(commentsResponse.data);
      if (resetDraft) setDraft(toDraft(cardResponse.data));
    },
    [base],
  );

  useEffect(() => {
    reload(true).catch((err) => setError(errorMessage(err, "Não foi possível carregar o card.")));
  }, [reload]);

  useEffect(() => {
    if (!showAssigneePicker) return;
    const close = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setShowAssigneePicker(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showAssigneePicker]);

  /** Executa uma ação imediata (checklist, etiqueta, responsável, comentário) */
  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      try {
        await action();
        await reload();
        onChanged();
      } catch (err) {
        setError(errorMessage(err));
      }
    },
    [reload, onChanged],
  );

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const { data } = await api.patch<CardDetail>(base, {
        title: draft.title,
        description: draft.description.trim() ? draft.description : null,
        dueDate: fromDateInput(draft.dueDate),
        completed: draft.completed,
      });
      setCard(data);
      setDraft(toDraft(data));
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function moveToList(listId: string) {
    const target = board.lists.find((list) => list.id === listId);
    if (!target || !card || listId === card.listId) return;
    run(() => api.patch(`${base}/move`, { listId, position: target.cardCount }));
  }

  async function addChecklist() {
    const title = newChecklist?.trim();
    if (!title) return;
    await run(() => api.post(`${base}/checklists`, { title }));
    setNewChecklist(null);
  }

  const toggleLabel = async (labelId: string, selected: boolean) => {
    if (selected) await api.post(`${base}/labels`, { labelId });
    else await api.delete(`${base}/labels/${labelId}`);
    await reload();
  };

  if (!card || !draft) {
    return (
      <Modal title="Card" onClose={onClose}>
        {error ? <FormError message={error} /> : <p className="text-[15px] text-muted">Carregando…</p>}
      </Modal>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(card));
  const unassigned = board.members.filter((m) => !card.assignees.some((a) => a.id === m.user.id));

  return (
    <>
      <Modal bare width={836} onClose={onClose}>
        <header className="flex items-start justify-between gap-4 border-b border-border px-[26px] pb-5 pt-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="text-[11px] uppercase tracking-[1.2px] text-muted">
              Card · {card.listName}
            </span>
            {canEdit ? (
              <input
                value={draft.title}
                maxLength={200}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="-mx-2 rounded-md border border-transparent px-2 py-0.5 text-[22px] font-bold text-ink outline-none hover:border-border focus:border-navy"
              />
            ) : (
              <h2 className="text-[22px] font-bold text-ink">{card.title}</h2>
            )}
          </div>
          <IconButton label="Fechar" size={32} onClick={onClose}>
            <X size={14} />
          </IconButton>
        </header>

        <div className="flex flex-col md:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-6 p-[26px]">
            {error && <FormError message={error} />}

            <section className="flex flex-col gap-2">
              <h3 className="text-[13.5px] font-medium text-body">Descrição</h3>
              {canEdit ? (
                <textarea
                  rows={3}
                  maxLength={5000}
                  value={draft.description}
                  placeholder="Adicione uma descrição mais detalhada…"
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="w-full resize-y rounded-lg border border-border bg-white p-3.5 text-[15px] text-ink outline-none focus:border-navy"
                />
              ) : (
                <p className="whitespace-pre-wrap rounded-lg border border-border p-3.5 text-[15px] text-ink">
                  {card.description || "Sem descrição."}
                </p>
              )}
            </section>

            {card.checklists.map((checklist) => (
              <ChecklistBlock key={checklist.id} boardId={board.id} checklist={checklist} canEdit={canEdit} run={run} />
            ))}

            {canEdit &&
              (newChecklist === null ? (
                <button
                  type="button"
                  onClick={() => setNewChecklist("Checklist")}
                  className="inline-flex h-9 w-fit items-center gap-1.5 rounded-md border border-border bg-white px-[13px] text-sm text-ink hover:bg-surface-alt"
                >
                  <Plus size={13} /> Adicionar checklist
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    maxLength={120}
                    value={newChecklist}
                    onChange={(e) => setNewChecklist(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addChecklist();
                      if (e.key === "Escape") setNewChecklist(null);
                    }}
                    className={`${inputClass} h-9`}
                  />
                  <Button compact onClick={addChecklist}>
                    Criar
                  </Button>
                  <IconButton label="Cancelar" size={36} onClick={() => setNewChecklist(null)}>
                    <X size={14} />
                  </IconButton>
                </div>
              ))}

            <CommentsSection
              boardId={board.id}
              cardId={card.id}
              comments={comments}
              currentUser={currentUser}
              canComment={canEdit}
              run={run}
            />
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-[22px] rounded-br-2xl border-t border-border bg-surface-alt p-[22px] md:w-[261px] md:border-l md:border-t-0">
            <div className="flex flex-col gap-[9px]">
              <span className={sidebarLabel}>Lista</span>
              <Select value={card.listId} disabled={!canEdit} onChange={(e) => moveToList(e.target.value)} className="h-10">
                {board.lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </Select>
            </div>

            <label className="flex items-center gap-3 text-[15px] text-ink">
              <Checkbox
                label="Concluído"
                checked={draft.completed}
                disabled={!canEdit}
                onChange={(completed) => setDraft({ ...draft, completed })}
              />
              Marcar como concluído
            </label>

            <div className="flex flex-col gap-[9px]">
              <span className={sidebarLabel}>Etiquetas</span>
              {card.labels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {card.labels.map((label) => (
                    <LabelChip key={label.id} label={label} large />
                  ))}
                </div>
              ) : (
                <span className="text-sm text-placeholder">Nenhuma etiqueta</span>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowLabels(true)}
                  className="h-[34px] w-fit rounded-md border border-border bg-white px-3 text-[13.5px] text-ink hover:bg-surface-alt"
                >
                  Gerenciar etiquetas
                </button>
              )}
            </div>

            <div className="flex flex-col gap-[9px]">
              <span className={sidebarLabel}>Responsáveis</span>
              <div className="flex flex-wrap items-center gap-[7px]">
                {card.assignees.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    disabled={!canEdit}
                    title={canEdit ? `Remover ${user.name}` : user.name}
                    onClick={() => run(() => api.delete(`${base}/assignees/${user.id}`))}
                    className="rounded-full disabled:cursor-default"
                  >
                    <Avatar user={user} size={32} title={canEdit ? `Remover ${user.name}` : user.name} />
                  </button>
                ))}
                {card.assignees.length === 0 && !canEdit && (
                  <span className="text-sm text-placeholder">Ninguém atribuído</span>
                )}
                {canEdit && (
                  <div ref={pickerRef} className="relative">
                    <button
                      type="button"
                      aria-label="Adicionar responsável"
                      title="Adicionar responsável"
                      onClick={() => setShowAssigneePicker((value) => !value)}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-border-strong bg-white text-muted hover:text-ink"
                    >
                      <Plus size={12} />
                    </button>
                    {showAssigneePicker && (
                      <div className="absolute left-0 top-9 z-20 w-56 rounded-xl border border-border bg-white p-1.5 shadow-lg">
                        {unassigned.length === 0 && (
                          <p className="px-2.5 py-2 text-sm text-muted">Todos os membros já estão atribuídos.</p>
                        )}
                        {unassigned.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              setShowAssigneePicker(false);
                              run(() => api.post(`${base}/assignees`, { userId: member.user.id }));
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-alt"
                          >
                            <Avatar user={member.user} size={24} />
                            <span className="truncate">{member.user.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[9px]">
              <span className={sidebarLabel}>Prazo</span>
              <div className="flex gap-1.5">
                <input
                  type="date"
                  disabled={!canEdit}
                  value={draft.dueDate}
                  onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                  className={`${inputClass} h-10 px-3.5`}
                />
                {canEdit && draft.dueDate && (
                  <IconButton label="Remover prazo" size={40} onClick={() => setDraft({ ...draft, dueDate: "" })}>
                    <X size={14} />
                  </IconButton>
                )}
              </div>
              {card.dueDate && (
                <DueBadge dueDate={card.dueDate} completed={card.completed} overdue={card.overdue} large />
              )}
            </div>

            {canEdit && (
              <div className="mt-auto flex flex-col gap-2.5 pt-6">
                {dirty && <span className="text-[12.5px] text-amber-text">Alterações não salvas</span>}
                <Button loading={saving} disabled={!dirty || !draft.title.trim()} onClick={save} className="h-10 w-full">
                  Salvar card
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDelete(true)}
                  className="h-10 w-full border-red-border text-red hover:bg-red-bg"
                >
                  Excluir card
                </Button>
              </div>
            )}
          </aside>
        </div>
      </Modal>

      {showLabels && (
        <LabelsModal
          boardId={board.id}
          labels={board.labels}
          canEdit={canEdit}
          selectedIds={card.labels.map((label) => label.id)}
          onToggle={toggleLabel}
          onChanged={() => {
            reload();
            onChanged();
          }}
          onClose={() => setShowLabels(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Excluir o card “${card.title}”?`}
          description="Ação irreversível: checklists e comentários do card também serão apagados."
          confirmLabel="Excluir card"
          onConfirm={async () => {
            await api.delete(base);
            onChanged();
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
