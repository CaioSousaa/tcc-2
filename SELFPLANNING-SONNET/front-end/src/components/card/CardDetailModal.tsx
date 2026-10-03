"use client";

import { CalendarClock, Tag, Trash2, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DueBadge } from "@/components/kanban/DueBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/Field";
import { LabelChip } from "@/components/ui/LabelChip";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { BoardDetail, CardDetail, CardSummary } from "@/lib/types";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";

function toSummary(detail: CardDetail): CardSummary {
  const { checklists: _c, comments: _m, ...summary } = detail;
  void _c;
  void _m;
  return { ...summary, commentCount: detail.comments.length };
}

export function CardDetailModal({
  cardId,
  board,
  currentUserId,
  onClose,
  onUpdated,
  onDeleted,
}: {
  cardId: string;
  board: BoardDetail;
  currentUserId: string;
  onClose: () => void;
  onUpdated: (card: CardSummary) => void;
  onDeleted: (cardId: string) => void;
}) {
  const [card, setCard] = useState<CardDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [picker, setPicker] = useState<"labels" | "members" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [cardId]);

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

  async function patch(data: { title?: string; description?: string | null; dueDate?: string | null }) {
    setError(null);
    try {
      const { data: summary } = await api.patch<CardSummary>(`/cards/${cardId}`, data);
      apply((c) => ({ ...c, ...summary }));
    } catch (err) {
      fail(err);
    }
  }

  async function setLabels(ids: string[]) {
    try {
      const { data } = await api.put<CardSummary>(`/cards/${cardId}/labels`, { labelIds: ids });
      apply((c) => ({ ...c, labels: data.labels }));
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

  async function remove() {
    try {
      await api.delete(`/cards/${cardId}`);
      onDeleted(cardId);
    } catch (err) {
      fail(err);
    }
  }

  if (!card) {
    return (
      <Modal onClose={onClose} width="max-w-3xl">
        <div className="p-8 text-sm text-muted">
          {error ? <FormError message={error} /> : "Carregando card..."}
        </div>
      </Modal>
    );
  }

  const labelIds = card.labels.map((l) => l.id);
  const assigneeIds = card.assignees.map((u) => u.id);
  const list = board.lists.find((l) => l.id === card.listId);

  return (
    <Modal onClose={onClose} width="max-w-3xl">
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1">
            <input
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                const next = title.trim();
                if (!next) setTitle(card.title);
                else if (next !== card.title) patch({ title: next });
              }}
              className="w-full rounded-lg border border-transparent px-2 py-1 text-xl font-semibold text-ink hover:border-border focus:border-navy focus:outline-none"
            />
            <p className="mt-1 px-2 text-xs text-muted">
              na lista <strong className="text-body">{list?.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1 text-muted hover:bg-black/5"
          >
            <X size={18} />
          </button>
        </div>

        <FormError message={error} />

        <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="space-y-6">
            {(card.labels.length > 0 || card.dueDate) && (
              <div className="flex flex-wrap items-center gap-2">
                {card.labels.map((l) => (
                  <LabelChip key={l.id} name={l.name} color={l.color} />
                ))}
                <DueBadge card={card} />
              </div>
            )}

            <section>
              <h3 className="mb-1.5 text-sm font-semibold text-ink">Descrição</h3>
              <textarea
                rows={4}
                value={description}
                maxLength={5000}
                placeholder="Adicione uma descrição mais detalhada..."
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description.trim() !== (card.description ?? "")) {
                    patch({ description: description.trim() || null });
                  }
                }}
                className="w-full resize-y rounded-lg border border-border bg-surface p-2.5 text-sm text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
              />
            </section>

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
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onChange={(comments) => apply((c) => ({ ...c, comments }))}
              onError={fail}
            />
          </div>

          <aside className="space-y-5">
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <Tag size={12} /> Etiquetas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {board.labels.map((l) => (
                  <LabelChip
                    key={l.id}
                    name={l.name}
                    color={l.color}
                    active={labelIds.includes(l.id)}
                    onClick={() =>
                      setLabels(
                        labelIds.includes(l.id)
                          ? labelIds.filter((id) => id !== l.id)
                          : [...labelIds, l.id],
                      )
                    }
                  />
                ))}
                {board.labels.length === 0 && (
                  <p className="text-xs text-muted">Crie etiquetas pelo botão “Etiquetas” do quadro.</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <Users size={12} /> Membros
              </h3>
              <div className="space-y-1">
                {board.members.map((m) => {
                  const on = assigneeIds.includes(m.userId);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() =>
                        setAssignees(on ? assigneeIds.filter((id) => id !== m.userId) : [...assigneeIds, m.userId])
                      }
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                        on ? "bg-blue-bg text-ink" : "text-body hover:bg-surface-alt"
                      }`}
                    >
                      <Avatar name={m.name} seed={m.userId} size={22} />
                      <span className="flex-1 truncate">{m.name}</span>
                      {on && <span className="text-xs text-blue">✓</span>}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                <CalendarClock size={12} /> Prazo
              </h3>
              <input
                type="date"
                value={card.dueDate ?? ""}
                onChange={(e) => patch({ dueDate: e.target.value || null })}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-ink focus:border-navy focus:outline-none"
              />
              {card.dueDate && (
                <button
                  type="button"
                  onClick={() => patch({ dueDate: null })}
                  className="mt-1.5 text-xs text-muted hover:text-red"
                >
                  Remover prazo
                </button>
              )}
            </section>

            <section className="border-t border-border pt-4">
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="text-xs text-body">Excluir este card definitivamente?</p>
                  <div className="flex gap-2">
                    <Button variant="danger" className="h-8" onClick={remove}>
                      Excluir
                    </Button>
                    <Button variant="ghost" className="h-8" onClick={() => setConfirmDelete(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="secondary" className="h-8 w-full text-red" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Excluir card
                </Button>
              )}
            </section>
          </aside>
        </div>
      </div>
    </Modal>
  );
}
