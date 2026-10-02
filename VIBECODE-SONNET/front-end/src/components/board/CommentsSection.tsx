"use client";

import { useState } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { formatCommentTime } from "@/lib/dates";
import type { Comment, User } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

function CommentItem({
  comment,
  canEdit,
  canDelete,
  onChanged,
  onError,
}: {
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const author = comment.author ?? { id: "removed", name: "Usuário removido", email: "" };

  async function save() {
    const value = content.trim();
    if (!value) return;
    setSaving(true);
    try {
      await api.patch(`/comments/${comment.id}`, { content: value });
      setEditing(false);
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Excluir este comentário?")) return;
    try {
      await api.delete(`/comments/${comment.id}`);
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    }
  }

  return (
    <li className="flex gap-3">
      <Avatar user={author} size={32} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-semibold text-ink">{author.name}</span>
          <time
            className="text-[12.5px] text-muted"
            dateTime={comment.createdAt}
            title={new Date(comment.createdAt).toLocaleString("pt-BR")}
          >
            {formatCommentTime(comment.createdAt)}
          </time>
          {comment.edited && (
            <span
              className="text-[12.5px] text-placeholder"
              title={`Editado em ${new Date(comment.updatedAt).toLocaleString("pt-BR")}`}
            >
              (editado)
            </span>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <Button size="sm" onClick={save} loading={saving}>
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setContent(comment.content);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.5] text-body">{comment.content}</p>
        )}
        {!editing && (canEdit || canDelete) && (
          <div className="flex gap-3 text-[12.5px]">
            {canEdit && (
              <button type="button" onClick={() => setEditing(true)} className="text-muted hover:text-ink hover:underline">
                Editar
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={remove} className="text-muted hover:text-red hover:underline">
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function CommentsSection({
  cardId,
  comments,
  currentUser,
  isAdmin,
  onChanged,
  onError,
}: {
  cardId: string;
  comments: Comment[];
  currentUser: User;
  isAdmin: boolean;
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
}) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    const value = content.trim();
    if (!value) return;
    setSending(true);
    try {
      await api.post(`/cards/${cardId}/comments`, { content: value });
      setContent("");
      await onChanged();
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-[13.5px] font-medium text-body">
        Comentários {comments.length > 0 && <span className="text-muted">({comments.length})</span>}
      </h3>

      {comments.length === 0 && <p className="text-sm text-placeholder">Nenhum comentário ainda.</p>}

      {/* Histórico em ordem cronológica (mais antigo primeiro) */}
      <ul className="flex flex-col gap-4">
        {comments.map((comment) => {
          const own = comment.author?.id === currentUser.id;
          return (
            <CommentItem
              key={`${comment.id}-${comment.updatedAt}`}
              comment={comment}
              canEdit={own}
              canDelete={own || isAdmin}
              onChanged={onChanged}
              onError={onError}
            />
          );
        })}
      </ul>

      <div className="flex gap-3">
        <Avatar user={currentUser} size={32} />
        <div className="flex flex-1 flex-col gap-2.5">
          <Textarea
            rows={2}
            placeholder="Escreva um comentário"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
            }}
          />
          <Button size="sm" className="w-fit" onClick={send} loading={sending} disabled={!content.trim()}>
            Comentar
          </Button>
        </div>
      </div>
    </section>
  );
}
