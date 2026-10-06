"use client";

import { Calendar, Check, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DueBadge } from "@/components/kanban/DueBadge";
import { LabelsModal } from "@/components/kanban/LabelsModal";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { FormError, Select, TextArea } from "@/components/ui/Field";
import { LabelChip } from "@/components/ui/LabelChip";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { dueFromKey } from "@/lib/dates";
import type { BoardDetail, CardDetail, CardSummary } from "@/lib/types";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";

function toSummary(detail: CardDetail): CardSummary {
  const { checklists: _c, comments: _m, ...summary } = detail;
  void _c;
  void _m;
  return { ...summary, commentCount: detail.comments.length };
}

const noop = () => {};

const SIDE_LABEL = "text-[13px] font-medium text-muted";

export function CardDetailModal({
  cardId,
  board,
  currentUser,
  onClose,
  onUpdated,
  onDeleted,
  onBoardChanged,
}: {
  cardId: string;
  board: BoardDetail;
  currentUser: { id: string; name: string };
  onClose: () => void;
  onUpdated: (card: CardSummary) => void;
  onDeleted: (cardId: string) => void;
  onBoardChanged: () => void;
}) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const assigneesRef = useRef<HTMLDivElement>(null);
  const isAdmin = board.role === "ADMIN";

  useEffect(() => {
    let cancelled = false;
    api
      .get<CardDetail>(`/cards/${cardId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setCard(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setDueDate(data.dueDate ?? "");
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [cardId]);

  useEffect(() => {
    if (!assigneesOpen) return;
    const close = (e: MouseEvent) => {
      if (!assigneesRef.current?.contains(e.target as Node)) setAssigneesOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [assigneesOpen]);

  const apply = useCallback(
    (updater: (c: CardDetail) => CardDetail) => {
      setCard((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        queueMicrotask(() => onUpdated(toSummary(next)));
        return next;
      });
    },
    [onUpdated],
  );

  const fail = useCallback((err: unknown) => setError(errorMessage(err)), []);

  const dirty =
    card !== null &&
    (title.trim() !== card.title ||
      description.trim() !== (card.description ?? "") ||
      dueDate !== (card.dueDate ?? ""));

  async function saveDrafts(): Promise<boolean> {
    if (!card || !dirty) return true;
    const data: { title?: string; description?: string | null; dueDate?: string | null } = {};
    if (title.trim() && title.trim() !== card.title) data.title = title.trim();
    if (description.trim() !== (card.description ?? "")) data.description = description.trim() || null;
    if (dueDate !== (card.dueDate ?? "")) data.dueDate = dueDate || null;
    if (Object.keys(data).length === 0) return true;
    setSaving(true);
    setError(null);
    try {
      const { data: summary } = await api.patch<CardSummary>(`/cards/${cardId}`, data);
      apply((c) => ({ ...c, ...summary }));
      return true;
    } catch (err) {
      fail(err);
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function closeAndSave() {
    if (await saveDrafts()) onClose();
  }

  async function setLabels(ids: string[]) {
    try {
      const { data } = await api.put<CardSummary>(`/cards/${cardId}/labels`, { labelIds: ids });
      apply((c) => ({ ...c, labels: data.labels }));
      onBoardChanged();
    } catch (err) {
      fail(err);
    }
  }

  async function setAssignees(ids: string[]) {
    try {
      const { data } = await api.put<CardSummary>(`/cards/${cardId}/assignees`, { userIds: ids });
      apply((c) => ({ ...c, assignees: data.assignees }));
    } catch (err) {
      fail(err);
    }
  }

  async function moveToList(listId: string) {
    const target = board.lists.find((l) => l.id === listId);
    if (!target || !card) return;
    try {
      await api.patch(`/cards/${cardId}/move`, { listId, position: target.cards.length });
      apply((c) => ({ ...c, listId }));
    } catch (err) {
      fail(err);
    }
  }

  async function remove() {
    try {
      await api.delete(`/cards/${cardId}`);
      onDeleted(cardId);
    } catch (err) {
      fail(err);
    }
  }

  const usage = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const list of board.lists) {
      for (const c of list.cards) for (const l of c.labels) counts[l.id] = (counts[l.id] ?? 0) + 1;
    }
    return counts;
  }, [board.lists]);

  if (!card) {
    return (
      <Modal onClose={onClose} width={836}>
        <div className="text-sm text-muted">
          {error ? <FormError message={error} /> : "Carregando card..."}
        </div>
      </Modal>
    );
  }

  const labelIds = card.labels.map((l) => l.id);
  const assigneeIds = card.assignees.map((u) => u.id);
  const list = board.lists.find((l) => l.id === card.listId);
  const draftDue = dueFromKey(dueDate || null);

  return (
    <>
      <Modal onClose={labelsOpen ? noop : closeAndSave} width={836} padded={false}>
        <div className="flex items-start justify-between gap-4 border-b border-border px-[26px] pt-6 pb-5">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[1.6px] text-muted uppercase">
              Card · {list?.name}
            </span>
            <input
              value={title}
              maxLength={200}
              aria-label="Título do card"
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-transparent bg-transparent text-[22px] font-bold tracking-[-0.3px] text-ink hover:border-border focus:border-navy focus:outline-none"
            />
          </div>
          <IconButton size={32} aria-label="Fechar" onClick={closeAndSave}>
            <X size={13} />
          </IconButton>
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-6 p-[26px]">
            <FormError message={error} />
            <TextArea
              label="Descrição"
              rows={3}
              value={description}
              maxLength={5000}
              placeholder="Adicione uma descrição mais detalhada..."
              onChange={(e) => setDescription(e.target.value)}
              className="resize-y"
            />

            <ChecklistSection
              cardId={card.id}
              checklists={card.checklists}
              onChange={(checklists) => apply((c) => ({ ...c, checklists }))}
              onProgress={(progress) => apply((c) => ({ ...c, progress }))}
              onError={fail}
            />

            <CommentsSection
              cardId={card.id}
              comments={card.comments}
              currentUser={currentUser}
              isAdmin={isAdmin}
              onChange={(comments) => apply((c) => ({ ...c, comments }))}
              onError={fail}
            />
          </div>

          <aside className="flex w-full shrink-0 flex-col gap-[22px] border-t border-border bg-surface-alt p-[22px] md:w-[260px] md:border-t-0 md:border-l">
            <div className="flex flex-col gap-[9px]">
              <span className={SIDE_LABEL}>Lista</span>
              <Select
                value={card.listId}
                disabled={!board.lists.length}
                aria-label="Lista do card"
                className="h-10 bg-surface text-[15px]"
                onChange={(e) => moveToList(e.target.value)}
              >
                {board.lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-col gap-[9px]">
              <span className={SIDE_LABEL}>Etiquetas</span>
              {card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {card.labels.map((l) => (
                    <LabelChip key={l.id} name={l.name} color={l.color} size="lg" />
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setLabelsOpen(true)}
                className="h-[34px] self-start rounded-md border border-border bg-surface px-3 text-[13.5px] text-ink hover:bg-surface-alt"
              >
                Gerenciar etiquetas
              </button>
            </div>

            <div className="flex flex-col gap-[9px]">
              <span className={SIDE_LABEL}>Responsáveis</span>
              <div ref={assigneesRef} className="relative flex flex-wrap items-center gap-[7px]">
                {card.assignees.map((u) => (
                  <Avatar key={u.id} name={u.name} seed={u.id} size={32} />
                ))}
                <button
                  type="button"
                  aria-label="Adicionar responsável"
                  onClick={() => setAssigneesOpen((v) => !v)}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-dashed border-[#C5CAD3] bg-surface text-muted hover:border-navy hover:text-navy"
                >
                  <Plus size={12} />
                </button>
                {assigneesOpen && (
                  <div className="absolute top-full left-0 z-20 mt-2 w-56 rounded-lg border border-border bg-surface py-1 shadow-lg">
                    {board.members.map((m) => {
                      const on = assigneeIds.includes(m.userId);
                      return (
                        <button
                          key={m.userId}
                          type="button"
                          onClick={() =>
                            setAssignees(
                              on
                                ? assigneeIds.filter((id) => id !== m.userId)
                                : [...assigneeIds, m.userId],
                            )
                          }
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-surface-alt"
                        >
                          <Avatar name={m.name} seed={m.userId} size={24} />
                          <span className="flex-1 truncate">{m.name}</span>
                          {on && <Check size={14} className="text-navy" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-[9px]">
              <span className={SIDE_LABEL}>Prazo</span>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  aria-label="Prazo do card"
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-surface px-3.5 text-[15px] text-ink focus:border-navy focus:outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <Calendar
                  size={15}
                  className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink"
                />
              </div>
              {dueDate && <DueBadge card={draftDue} block />}
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="self-start text-[13px] text-muted hover:text-red"
                >
                  Remover prazo
                </button>
              )}
            </div>

            <div className="flex-1" />

            {confirmDelete ? (
              <div className="flex flex-col gap-2">
                <p className="text-[13.5px] text-body">Excluir este card definitivamente?</p>
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={remove}>
                    Excluir
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Button
                  className="h-10 w-full"
                  disabled={saving || !title.trim()}
                  onClick={async () => {
                    if (await saveDrafts()) onClose();
                  }}
                >
                  Salvar card
                </Button>
                <Button
                  variant="secondary"
                  className="h-10 w-full text-red-dark"
                  onClick={() => setConfirmDelete(true)}
                >
                  Excluir card
                </Button>
              </div>
            )}
          </aside>
        </div>
      </Modal>

      {labelsOpen && (
        <LabelsModal
          boardId={board.id}
          labels={board.labels}
          usage={usage}
          isAdmin={isAdmin}
          selectedIds={labelIds}
          onToggle={(id) =>
            setLabels(labelIds.includes(id) ? labelIds.filter((x) => x !== id) : [...labelIds, id])
          }
          onClose={() => setLabelsOpen(false)}
          onChanged={onBoardChanged}
        />
      )}
    </>
  );
}
