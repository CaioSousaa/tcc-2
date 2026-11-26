"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { commentTime } from "@/lib/format";
import type { Comment, User } from "@/lib/types";

interface CommentsSectionProps {
  boardId: string;
  cardId: string;
  comments: Comment[];
  currentUser: User;
  canComment: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>;
}

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-white p-3.5 text-[15px] text-ink outline-none focus:border-navy";

export function CommentsSection({ boardId, cardId, comments, currentUser, canComment, run }: CommentsSectionProps) {
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; content: string } | null>(null);

  async function publish() {
    const content = draft.trim();
    if (!content) return;
    await run(() => api.post(`/boards/${boardId}/cards/${cardId}/comments`, { content }));
    setDraft("");
  }

  async function saveEdit() {
    if (!editing?.content.trim()) return;
    await run(() => api.patch(`/boards/${boardId}/comments/${editing.id}`, { content: editing.content }));
    setEditing(null);
  }

  function remove(comment: Comment) {
    if (!window.confirm("Excluir este comentário?")) return;
    run(() => api.delete(`/boards/${boardId}/comments/${comment.id}`));
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[13.5px] font-medium text-body">
        Comentários {comments.length > 0 && <span className="text-muted">({comments.length})</span>}
      </h3>

      {comments.length === 0 && <p className="text-sm text-muted">Nenhum comentário ainda.</p>}

      {comments.map((comment) => {
        const own = comment.author.id === currentUser.id;
        return (
          <article key={comment.id} className="flex gap-3">
            <Avatar user={comment.author} size={32} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-[15px] font-semibold text-ink">{comment.author.name}</span>
                <span className="text-[12.5px] text-muted">
                  {commentTime(comment.createdAt)}
                  {comment.edited && " · editado"}
                </span>
              </div>
              {editing?.id === comment.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    autoFocus
                    rows={3}
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    className={textareaClass}
                  />
                  <div className="flex gap-2">
                    <Button compact onClick={saveEdit}>
                      Salvar
                    </Button>
                    <Button compact variant="secondary" onClick={() => setEditing(null)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words text-[15px] text-body">{comment.content}</p>
              )}
              {own && canComment && editing?.id !== comment.id && (
                <div className="flex gap-3 text-[13px] text-muted">
                  <button type="button" className="hover:text-ink" onClick={() => setEditing({ id: comment.id, content: comment.content })}>
                    Editar
                  </button>
                  <button type="button" className="hover:text-red" onClick={() => remove(comment)}>
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {canComment && (
        <div className="flex gap-3">
          <Avatar user={currentUser} size={32} />
          <div className="flex flex-1 flex-col gap-2.5">
            <textarea
              rows={2}
              value={draft}
              maxLength={5000}
              placeholder="Escreva um comentário"
              onChange={(e) => setDraft(e.target.value)}
              className={textareaClass}
            />
            <Button compact className="w-fit" disabled={!draft.trim()} onClick={publish}>
              Comentar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
