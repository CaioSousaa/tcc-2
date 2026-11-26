"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { dateInputToIso, isoToDateInput } from "@/lib/dates";
import type { BoardDetail, CardDetail, User } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { IconButton } from "@/components/ui/IconButton";
import { Textarea } from "@/components/ui/Input";
import { LabelChip } from "@/components/ui/LabelChip";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";
import { DueBadge } from "./DueBadge";
import { LabelsModal } from "./LabelsModal";

interface CardDetailModalProps {
  cardId: string | null;
  board: BoardDetail;
  currentUser: User;
  onClose: () => void;
  /** Recarrega o quadro após alterações no card. */
  onChanged: () => void;
}

interface Draft {
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  listId: string;
}

function draftFrom(card: CardDetail): Draft {
  return {
    title: card.title,
    description: card.description ?? "",
    dueDate: isoToDateInput(card.dueDate),
    completed: card.completed,
    listId: card.listId,
  };
}

function SidebarBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[9px]">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}

export function CardDetailModal({ cardId, board, currentUser, onClose, onChanged }: CardDetailModalProps) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = board.role === "admin";

  const fetchCard = useCallback(async () => {
    if (!cardId) return null;
    const { data } = await api.get<{ card: CardDetail }>(`/cards/${cardId}`);
    setCard(data.card);
    return data.card;
  }, [cardId]);

  useEffect(() => {
    setCard(null);
    setDraft(null);
    setError(null);
    setAssigneesOpen(false);
    if (!cardId) return;
    fetchCard()
      .then((loaded) => loaded && setDraft(draftFrom(loaded)))
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar o card.")));
  }, [cardId, fetchCard]);

  /** Recarrega card e quadro após ações imediatas (checklist, comentário…). */
  const refresh = useCallback(async () => {
    try {
      await fetchCard();
    } catch (err) {
      setError(getErrorMessage(err));
    }
    onChanged();
  }, [fetchCard, onChanged]);

  const dirty =
    card && draft
      ? draft.title.trim() !== card.title ||
        draft.description.trim() !== (card.description ?? "") ||
        draft.dueDate !== isoToDateInput(card.dueDate) ||
        draft.completed !== card.completed ||
        draft.listId !== card.listId
      : false;

  async function save() {
    if (!card || !draft) return;
    if (!draft.title.trim()) {
      setError("O título do card é obrigatório.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/cards/${card.id}`, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        dueDate: dateInputToIso(draft.dueDate),
        completed: draft.completed,
      });
      if (draft.listId !== card.listId) {
        const target = board.lists.find((l) => l.id === draft.listId);
        await api.patch(`/cards/${card.id}/move`, {
          listId: draft.listId,
          position: target?.cards.length ?? 0,
        });
      }
      const updated = await fetchCard();
      if (updated) setDraft(draftFrom(updated));
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleAssignee(user: User) {
    if (!card) return;
    const assigned = card.assignees.some((a) => a.id === user.id);
    try {
      if (assigned) await api.delete(`/cards/${card.id}/assignees/${user.id}`);
      else await api.post(`/cards/${card.id}/assignees`, { userId: user.id });
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function deleteCard() {
    if (!card) return;
    setDeleting(true);
    try {
      await api.delete(`/cards/${card.id}`);
      setConfirmDelete(false);
      onChanged();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  function requestClose() {
    if (dirty && !window.confirm("Descartar alterações não salvas deste card?")) return;
    onClose();
  }

  const listTitle = board.lists.find((l) => l.id === card?.listId)?.title ?? card?.list?.title ?? "";

  return (
    <>
      <Modal open={Boolean(cardId)} onClose={requestClose} width={836} bare>
        {!card || !draft ? (
          <div className="flex flex-col items-center gap-4 p-16">
            {error ? (
              <>
                <p className="text-red-dark">{error}</p>
                <Button variant="secondary" onClick={onClose}>
                  Fechar
                </Button>
              </>
            ) : (
              <LoaderCircle className="size-7 animate-spin text-muted" />
            )}
          </div>
        ) : (
          <>
            <header className="flex shrink-0 justify-between gap-4 border-b border-border px-[26px] pb-5 pt-6">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[1.6px] text-muted">
                  Card · {listTitle}
                </span>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  aria-label="Título do card"
                  className="w-full rounded-md border border-transparent bg-transparent px-1 -ml-1 text-[22px] font-bold tracking-[-0.3px] text-ink outline-none hover:border-border focus:border-navy"
                />
              </div>
              <IconButton icon={X} label="Fechar" size={32} onClick={requestClose} />
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-6 p-[26px]">
                {error && (
                  <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark" role="alert">
                    {error}
                  </p>
                )}

                <section className="flex flex-col gap-2">
                  <h3 className="text-[13.5px] font-medium text-body">Descrição</h3>
                  <Textarea
                    rows={3}
                    placeholder="Adicione uma descrição mais detalhada…"
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  />
                </section>

                <ChecklistSection
                  cardId={card.id}
                  checklists={card.checklists}
                  onChanged={refresh}
                  onError={setError}
                />

                <CommentsSection
                  cardId={card.id}
                  comments={card.comments}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                  onChanged={refresh}
                  onError={setError}
                />
              </div>

              <aside className="flex w-full shrink-0 flex-col gap-[22px] border-t border-border bg-surface-alt p-[22px] md:w-[261px] md:border-l md:border-t-0">
                <SidebarBlock label="Lista">
                  <Select
                    selectSize="sm"
                    className="h-10 bg-surface"
                    value={draft.listId}
                    onChange={(e) => setDraft({ ...draft, listId: e.target.value })}
                  >
                    {board.lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </Select>
                </SidebarBlock>

                <SidebarBlock label="Etiquetas">
                  {card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {card.labels.map((label) => (
                        <LabelChip key={label.id} label={label} large />
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setLabelsOpen(true)}
                    className="flex h-[34px] w-fit items-center rounded-md border border-border bg-surface px-3 text-[13.5px] text-ink hover:bg-page"
                  >
                    Gerenciar etiquetas
                  </button>
                </SidebarBlock>

                <SidebarBlock label="Responsáveis">
                  <div className="relative flex flex-wrap items-center gap-[7px]">
                    {card.assignees.map((user) => (
                      <Avatar key={user.id} user={user} size={32} />
                    ))}
                    <button
                      type="button"
                      aria-label="Adicionar responsável"
                      onClick={() => setAssigneesOpen((v) => !v)}
                      className="flex size-[30px] items-center justify-center rounded-full border border-dash bg-surface text-muted hover:border-muted hover:text-ink"
                    >
                      <Plus className="size-3" />
                    </button>
                    {assigneesOpen && (
                      <div className="absolute left-0 top-10 z-10 w-[230px] rounded-xl border border-border bg-surface p-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                        <p className="px-2 pb-1.5 pt-1 text-[12px] font-medium text-muted">Membros do quadro</p>
                        {board.members.map((member) => {
                          const assigned = card.assignees.some((a) => a.id === member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => toggleAssignee(member)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-surface-alt"
                            >
                              <Checkbox checked={assigned} />
                              <Avatar user={member} size={24} />
                              <span className="truncate text-sm text-ink">{member.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </SidebarBlock>

                <SidebarBlock label="Prazo">
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={draft.dueDate}
                      onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                      className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3.5 text-[15px] text-ink outline-none focus:border-navy"
                    />
                    {draft.dueDate && (
                      <IconButton
                        icon={X}
                        label="Remover prazo"
                        size={40}
                        onClick={() => setDraft({ ...draft, dueDate: "" })}
                      />
                    )}
                  </div>
                  {draft.dueDate && (
                    <DueBadge
                      dueDate={dateInputToIso(draft.dueDate)}
                      completed={draft.completed}
                      className="w-full py-[7px]"
                    />
                  )}
                  <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-sm text-body">
                    <Checkbox
                      checked={draft.completed}
                      onChange={(value) => setDraft({ ...draft, completed: value })}
                    />
                    Marcar como concluído
                  </label>
                </SidebarBlock>

                <div className="flex-1" />

                <div className="flex flex-col gap-2">
                  <Button className="h-10 w-full" onClick={save} loading={saving} disabled={!dirty}>
                    Salvar card
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-10 w-full border-red-border text-red-dark hover:bg-red-bg"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Excluir card
                  </Button>
                </div>
              </aside>
            </div>
          </>
        )}
      </Modal>

      <LabelsModal
        open={labelsOpen}
        boardId={board.id}
        labels={board.labels}
        isAdmin={isAdmin}
        card={card ? { id: card.id, labelIds: card.labels.map((l) => l.id) } : null}
        onClose={() => setLabelsOpen(false)}
        onChanged={refresh}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Excluir este card?"
        description="O card, suas checklists e comentários serão apagados permanentemente."
        confirmLabel="Excluir card"
        loading={deleting}
        onConfirm={deleteCard}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
