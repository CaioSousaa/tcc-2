"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ListChecks, Plus, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { FieldError, Input, Select, Textarea } from "@/components/ui/Field";
import { LabelChip } from "@/components/ui/LabelChip";
import { CloseButton, Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { api, getApiError, getErrorMessage } from "@/lib/api";
import { fromDateInputValue, toDateInputValue } from "@/lib/dates";
import type { BoardDetail, CardDetail, Checklist, Comment } from "@/lib/types";
import { ChecklistBlock } from "./ChecklistBlock";
import { CommentsSection } from "./CommentsSection";
import { DueBadge } from "./DueBadge";
import { LabelsModal } from "./LabelsModal";

interface CardDetailModalProps {
  cardId: string | null;
  board: BoardDetail;
  labelUsage: Map<string, number>;
  onClose: () => void;
  /** Called after any change so the board can refresh its summaries. */
  onBoardChange: () => void;
}

interface Draft {
  title: string;
  description: string;
  due: string;
  listId: string;
}

function toDraft(card: CardDetail): Draft {
  return {
    title: card.title,
    description: card.description ?? "",
    due: toDateInputValue(card.dueDate),
    listId: card.listId,
  };
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[14px] text-body">{title}</p>
      {children}
    </div>
  );
}

function AssigneePicker({
  board,
  card,
  onToggle,
}: {
  board: BoardDetail;
  card: CardDetail;
  onToggle: (userId: string, attach: boolean) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = board.role === "admin";

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex flex-wrap items-center gap-2">
        {card.assignees.map((assignee) => (
          <Avatar key={assignee.id} user={assignee} size={32} />
        ))}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Gerenciar responsáveis"
          title="Gerenciar responsáveis"
          className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-ink"
        >
          <Plus size={14} />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-10 w-[260px] rounded-xl border border-border bg-surface p-2 shadow-xl">
          <p className="px-2 pb-2 pt-1 text-[12.5px] text-muted">
            {isAdmin
              ? "Atribua membros do quadro a este card."
              : "Você pode se atribuir ou se remover deste card."}
          </p>
          <ul className="max-h-[240px] overflow-y-auto">
            {board.members.map((member) => {
              const assigned = card.assigneeIds.includes(member.userId);
              const allowed = isAdmin || member.userId === user?.id;
              return (
                <li key={member.userId}>
                  <label
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
                      allowed ? "cursor-pointer hover:bg-surface-alt" : "opacity-50"
                    }`}
                  >
                    <Checkbox
                      checked={assigned}
                      disabled={!allowed}
                      onChange={(value) => onToggle(member.userId, value)}
                      ariaLabel={`Atribuir ${member.user.name}`}
                    />
                    <Avatar user={member.user} size={26} />
                    <span className="truncate text-[14.5px] text-ink">{member.user.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function CardDetailModal({
  cardId,
  board,
  labelUsage,
  onClose,
  onBoardChange,
}: CardDetailModalProps) {
  const toast = useToast();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [newChecklist, setNewChecklist] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = board.role === "admin";

  const applyCard = useCallback((next: CardDetail, resetDraft = false) => {
    setCard(next);
    if (resetDraft) setDraft(toDraft(next));
  }, []);

  useEffect(() => {
    if (!cardId) return;
    let cancelled = false;
    setCard(null);
    setDraft(null);
    setLoadError(null);
    setSaveError(null);
    setConfirmDelete(false);
    setNewChecklist(null);
    api
      .get<{ card: CardDetail }>(`/cards/${cardId}`)
      .then(({ data }) => {
        if (!cancelled) applyCard(data.card, true);
      })
      .catch((err) => {
        if (!cancelled) {
          const error = getApiError(err);
          setLoadError(
            error.status === 404 ? "Este card não existe mais." : (error.message ?? "Erro"),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, applyCard]);

  const dirty =
    card && draft
      ? JSON.stringify(toDraft(card)) !== JSON.stringify(draft)
      : false;

  function requestClose() {
    if (dirty && !window.confirm("Descartar as alterações não salvas deste card?")) return;
    onClose();
  }

  /** Runs a request that returns the updated card and refreshes the board. */
  async function mutateCard(request: () => Promise<{ data: { card: CardDetail } }>) {
    try {
      const { data } = await request();
      setCard((current) =>
        current ? { ...data.card, comments: current.comments } : data.card,
      );
      onBoardChange();
      return data.card;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return null;
    }
  }

  async function save() {
    if (!card || !draft) return;
    if (!draft.title.trim()) {
      setSaveError("O título do card não pode ficar vazio");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await api.patch<{ card: CardDetail }>(`/cards/${card.id}`, {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        dueDate: fromDateInputValue(draft.due),
      });
      let updated = data.card;
      if (draft.listId !== card.listId) {
        const target = board.lists.find((list) => list.id === draft.listId);
        const moved = await api.patch<{ card: CardDetail }>(`/cards/${card.id}/move`, {
          listId: draft.listId,
          position: target ? target.cards.length : 0,
        });
        updated = moved.data.card;
      }
      applyCard({ ...updated, comments: card.comments }, true);
      onBoardChange();
      toast.success("Card salvo");
    } catch (err) {
      setSaveError(getErrorMessage(err, "Não foi possível salvar o card"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleCompleted(completed: boolean) {
    if (!card) return;
    await mutateCard(() =>
      api.patch<{ card: CardDetail }>(`/cards/${card.id}`, { completed }),
    );
  }

  async function toggleLabel(labelId: string, attach: boolean) {
    if (!card) return;
    await mutateCard(() =>
      attach
        ? api.put<{ card: CardDetail }>(`/cards/${card.id}/labels/${labelId}`)
        : api.delete<{ card: CardDetail }>(`/cards/${card.id}/labels/${labelId}`),
    );
  }

  async function toggleAssignee(userId: string, attach: boolean) {
    if (!card) return;
    await mutateCard(() =>
      attach
        ? api.put<{ card: CardDetail }>(`/cards/${card.id}/assignees/${userId}`)
        : api.delete<{ card: CardDetail }>(`/cards/${card.id}/assignees/${userId}`),
    );
  }

  function updateChecklists(checklists: Checklist[]) {
    setCard((current) => (current ? { ...current, checklists } : current));
    onBoardChange();
  }

  async function createChecklist() {
    if (!card || !newChecklist?.trim()) return;
    try {
      const { data } = await api.post<{ checklist: Checklist }>(
        `/cards/${card.id}/checklists`,
        { title: newChecklist.trim() },
      );
      updateChecklists([...card.checklists, data.checklist]);
      setNewChecklist(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function updateComments(comments: Comment[]) {
    setCard((current) =>
      current ? { ...current, comments, commentCount: comments.length } : current,
    );
    onBoardChange();
  }

  async function deleteCard() {
    if (!card) return;
    setDeleting(true);
    try {
      await api.delete(`/cards/${card.id}`);
      toast.success("Card excluído");
      onBoardChange();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  }

  const currentList = board.lists.find((list) => list.id === card?.listId);
  const checklistTotal = card?.checklists.reduce((sum, item) => sum + item.items.length, 0) ?? 0;
  const checklistDone =
    card?.checklists.reduce(
      (sum, item) => sum + item.items.filter((entry) => entry.done).length,
      0,
    ) ?? 0;
  const previewDue = draft ? fromDateInputValue(draft.due) : null;

  return (
    <>
      <Modal open={Boolean(cardId)} onClose={requestClose} width={836} bare>
        {!card || !draft ? (
          <div className="p-[26px]">
            <div className="flex justify-end">
              <CloseButton onClick={onClose} />
            </div>
            {loadError ? (
              <p className="py-16 text-center text-[15px] text-muted">{loadError}</p>
            ) : (
              <Spinner label="Carregando card..." />
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <header className="flex items-start justify-between gap-4 border-b border-border px-[26px] pb-5 pt-6">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  Card · {currentList?.title ?? card.listTitle}
                </p>
                <input
                  value={draft.title}
                  maxLength={200}
                  aria-label="Título do card"
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  className="mt-2 w-full rounded-md bg-transparent px-1 -ml-1 text-[22px] font-bold text-ink outline-none focus:bg-surface-alt focus:ring-2 focus:ring-navy/15"
                />
              </div>
              <CloseButton onClick={requestClose} />
            </header>

            <div className="flex flex-col md:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-7 px-[26px] py-6">
                <section>
                  <label htmlFor="card-description" className="text-[15px] text-body">
                    Descrição
                  </label>
                  <Textarea
                    id="card-description"
                    className="mt-2.5 text-[15.5px]"
                    rows={3}
                    placeholder="Adicione mais detalhes a este card..."
                    value={draft.description}
                    maxLength={5000}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </section>

                <section className="flex flex-col gap-6">
                  {card.checklists.length === 0 && newChecklist === null && (
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] text-body">Checklist</p>
                      <Button size="sm" variant="secondary" onClick={() => setNewChecklist("Checklist")}>
                        <ListChecks size={14} /> Adicionar checklist
                      </Button>
                    </div>
                  )}
                  {card.checklists.length > 1 && (
                    <p className="font-mono text-[12.5px] text-muted">
                      Progresso total: {checklistDone}/{checklistTotal} itens
                      {checklistTotal > 0 &&
                        ` (${Math.round((checklistDone / checklistTotal) * 100)}%)`}
                    </p>
                  )}
                  {card.checklists.map((checklist) => (
                    <ChecklistBlock
                      key={checklist.id}
                      checklist={checklist}
                      onChange={(updated) =>
                        updateChecklists(
                          card.checklists.map((item) => (item.id === updated.id ? updated : item)),
                        )
                      }
                      onDeleted={(id) =>
                        updateChecklists(card.checklists.filter((item) => item.id !== id))
                      }
                    />
                  ))}
                  {newChecklist !== null ? (
                    <div className="flex items-center gap-2">
                      <Input
                        className="h-10 text-[15px]"
                        autoFocus
                        placeholder="Título do checklist"
                        value={newChecklist}
                        maxLength={120}
                        onChange={(event) => setNewChecklist(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") createChecklist();
                          if (event.key === "Escape") setNewChecklist(null);
                        }}
                      />
                      <Button size="sm" onClick={createChecklist} disabled={!newChecklist.trim()}>
                        Criar
                      </Button>
                      <IconButton label="Cancelar" onClick={() => setNewChecklist(null)}>
                        <X size={13} />
                      </IconButton>
                    </div>
                  ) : (
                    card.checklists.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="self-start"
                        onClick={() => setNewChecklist("Checklist")}
                      >
                        <ListChecks size={14} /> Adicionar outro checklist
                      </Button>
                    )
                  )}
                </section>

                <CommentsSection
                  cardId={card.id}
                  comments={card.comments}
                  isAdmin={isAdmin}
                  onChange={updateComments}
                />
              </div>

              <aside className="flex w-full flex-col gap-6 border-t border-border bg-surface-alt px-[22px] py-6 md:w-[262px] md:shrink-0 md:rounded-br-2xl md:border-l md:border-t-0">
                <SidebarSection title="Lista">
                  <Select
                    value={draft.listId}
                    aria-label="Lista do card"
                    onChange={(event) => setDraft({ ...draft, listId: event.target.value })}
                  >
                    {board.lists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </Select>
                </SidebarSection>

                <SidebarSection title="Etiquetas">
                  {card.labels.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {card.labels.map((label) => (
                        <LabelChip key={label.id} label={label} className="text-[14px]" />
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setLabelsOpen(true)}>
                    Gerenciar etiquetas
                  </Button>
                </SidebarSection>

                <SidebarSection title="Responsáveis">
                  <AssigneePicker board={board} card={card} onToggle={toggleAssignee} />
                </SidebarSection>

                <SidebarSection title="Prazo">
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="h-11 text-[15px]"
                      value={draft.due}
                      aria-label="Data de vencimento"
                      onChange={(event) => setDraft({ ...draft, due: event.target.value })}
                    />
                    {draft.due && (
                      <IconButton
                        label="Remover prazo"
                        size={36}
                        onClick={() => setDraft({ ...draft, due: "" })}
                      >
                        <X size={14} />
                      </IconButton>
                    )}
                  </div>
                  {previewDue && (
                    <DueBadge
                      dueDate={previewDue}
                      completed={card.completed}
                      className="mt-2.5 w-full"
                    />
                  )}
                  <Checkbox
                    className="mt-3 text-[14.5px] text-body"
                    checked={card.completed}
                    onChange={toggleCompleted}
                    label="Tarefa concluída"
                  />
                </SidebarSection>

                <div className="mt-auto flex flex-col gap-3 pt-4">
                  <FieldError message={saveError} />
                  <Button onClick={save} loading={saving} disabled={!dirty}>
                    Salvar card
                  </Button>
                  {confirmDelete ? (
                    <div className="rounded-lg border border-[#F1C9C5] bg-surface p-3">
                      <p className="text-[13.5px] text-red-dark">
                        Excluir este card, seus checklists e comentários?
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <Button size="sm" variant="danger" loading={deleting} onClick={deleteCard}>
                          Excluir
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="danger-outline" onClick={() => setConfirmDelete(true)}>
                      Excluir card
                    </Button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        )}
      </Modal>

      {card && (
        <LabelsModal
          open={labelsOpen}
          boardId={board.board.id}
          labels={board.labels}
          usage={labelUsage}
          isAdmin={isAdmin}
          cardLabelIds={card.labelIds}
          onToggleCardLabel={toggleLabel}
          onClose={() => setLabelsOpen(false)}
          onChanged={() => {
            onBoardChange();
            // Label renames/deletions must also reach the open card.
            api
              .get<{ card: CardDetail }>(`/cards/${card.id}`)
              .then(({ data }) => setCard(data.card))
              .catch(() => undefined);
          }}
        />
      )}
    </>
  );
}
