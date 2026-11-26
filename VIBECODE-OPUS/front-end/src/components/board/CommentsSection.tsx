"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { api, getErrorMessage } from "@/lib/api";
import { formatCommentDate } from "@/lib/dates";
import type { Comment } from "@/lib/types";

interface CommentsSectionProps {
  cardId: string;
  comments: Comment[];
  isAdmin: boolean;
  onChange: (comments: Comment[]) => void;
}

function CommentItem({
  comment,
  canEdit,
  canDelete,
  onUpdated,
  onDeleted,
}: {
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
  onUpdated: (comment: Comment) => void;
  onDeleted: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!content.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.patch<{ comment: Comment }>(`/comments/${comment.id}`, {
        content: content.trim(),
      });
      onUpdated(data.comment);
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir este comentário?")) return;
    try {
      await api.delete(`/comments/${comment.id}`);
      onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  const author = comment.author ?? { id: "removed", name: "Usuário removido" };

  return (
    <li className="flex gap-3">
      <Avatar user={author} size={32} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15.5px] font-semibold text-ink">{author.name}</span>
          <time dateTime={comment.createdAt} className="text-[13px] text-muted">
            {formatCommentDate(comment.createdAt)}
          </time>
          {comment.editedAt && (
            <span
              className="text-[12.5px] text-placeholder"
              title={`Editado ${formatCommentDate(comment.editedAt)}`}
            >
              (editado)
            </span>
          )}
        </p>
        {editing ? (
          <div className="mt-1.5">
            <Textarea
              rows={3}
              autoFocus
              value={content}
              maxLength={5000}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" loading={busy} onClick={save} disabled={!content.trim()}>
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setContent(comment.content);
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap break-words text-[15.5px] leading-relaxed text-body">
            {comment.content}
          </p>
        )}
        {!editing && (canEdit || canDelete) && (
          <div className="mt-1 flex gap-3 text-[13px] text-muted">
            {canEdit && (
              <button type="button" className="hover:text-ink hover:underline" onClick={() => setEditing(true)}>
                Editar
              </button>
            )}
            {canDelete && (
              <button type="button" className="hover:text-red hover:underline" onClick={remove}>
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function CommentsSection({ cardId, comments, isAdmin, onChange }: CommentsSectionProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post<{ comment: Comment }>(`/cards/${cardId}/comments`, {
        content: content.trim(),
      });
      onChange([...comments, data.comment]);
      setContent("");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section>
      <h3 className="text-[15px] text-body">
        Comentários{" "}
        {comments.length > 0 && (
          <span className="font-mono text-[13px] text-placeholder">{comments.length}</span>
        )}
      </h3>

      {comments.length === 0 ? (
        <p className="mt-3 text-[14px] text-muted">Nenhum comentário ainda.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-5" aria-label="Histórico de comentários">
          {comments.map((comment) => {
            const isAuthor = comment.author?.id === user?.id;
            return (
              <CommentItem
                key={comment.id}
                comment={comment}
                canEdit={isAuthor}
                canDelete={isAuthor || isAdmin}
                onUpdated={(updated) =>
                  onChange(comments.map((item) => (item.id === updated.id ? updated : item)))
                }
                onDeleted={() => onChange(comments.filter((item) => item.id !== comment.id))}
              />
            );
          })}
        </ol>
      )}

      {user && (
        <div className="mt-5 flex gap-3">
          <Avatar user={user} size={32} />
          <div className="flex-1">
            <Textarea
              rows={2}
              placeholder="Escreva um comentário"
              value={content}
              maxLength={5000}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit();
              }}
            />
            <Button
              className="mt-2.5 h-9"
              loading={sending}
              disabled={!content.trim()}
              onClick={submit}
            >
              Comentar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
