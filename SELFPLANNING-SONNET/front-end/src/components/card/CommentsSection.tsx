"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";
import type { Comment } from "@/lib/types";

export function CommentsSection({
  cardId,
  comments,
  currentUserId,
  isAdmin,
  onChange,
  onError,
}: {
  cardId: string;
  comments: Comment[];
  currentUserId: string;
  isAdmin: boolean;
  onChange: (comments: Comment[]) => void;
  onError: (e: unknown) => void;
}) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = content.trim();
    if (!value) return;
    setBusy(true);
    try {
      const { data } = await api.post<Comment>(`/cards/${cardId}/comments`, { content: value });
      onChange([...comments, data]);
      setContent("");
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  }

  async function remove(comment: Comment) {
    try {
      await api.delete(`/comments/${comment.id}`);
      onChange(comments.filter((c) => c.id !== comment.id));
    } catch (err) {
      onError(err);
    }
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-ink">
        Comentários {comments.length > 0 && <span className="font-normal text-muted">({comments.length})</span>}
      </h3>
      <form onSubmit={submit} className="space-y-2">
        <textarea
          rows={2}
          value={content}
          maxLength={2000}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva um comentário..."
          className="w-full resize-none rounded-lg border border-border bg-surface p-2.5 text-sm text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
        />
        <div className="flex justify-end">
          <Button type="submit" className="h-8" disabled={busy || !content.trim()}>
            Comentar
          </Button>
        </div>
      </form>
      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="group flex gap-2.5">
            <Avatar name={c.author.name} seed={c.author.id} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-xs">
                <span className="font-semibold text-ink">{c.author.name}</span>{" "}
                <span className="text-muted">{formatDateTime(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 text-sm whitespace-pre-wrap text-body">{c.content}</p>
            </div>
            {(c.author.id === currentUserId || isAdmin) && (
              <IconButton
                aria-label="Excluir comentário"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={() => remove(c)}
              >
                <Trash2 size={13} />
              </IconButton>
            )}
          </li>
        ))}
        {comments.length === 0 && <li className="text-sm text-muted">Nenhum comentário ainda.</li>}
      </ul>
    </section>
  );
}
