"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { formatCommentTime } from "@/lib/dates";
import type { Comment } from "@/lib/types";

export function CommentsSection({
  cardId,
  comments,
  currentUser,
  isAdmin,
  onChange,
  onError,
}: {
  cardId: string;
  comments: Comment[];
  currentUser: { id: string; name: string };
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
    <section className="flex w-full flex-col gap-4">
      <span className="text-[13.5px] font-medium text-body">Comentários</span>
      {comments.map((c) => (
        <div key={c.id} className="group flex gap-3">
          <Avatar name={c.author.name} seed={c.author.id} size={32} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold text-ink">{c.author.name}</span>
              <span className="text-[12.5px] text-muted">{formatCommentTime(c.createdAt)}</span>
              {(c.author.id === currentUser.id || isAdmin) && (
                <button
                  type="button"
                  aria-label="Excluir comentário"
                  onClick={() => remove(c)}
                  className="ml-auto text-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:text-red"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <p className="text-[15px] leading-[23px] whitespace-pre-wrap text-body">{c.content}</p>
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex gap-3">
        <Avatar name={currentUser.name} seed={currentUser.id} size={32} />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
          <textarea
            rows={2}
            value={content}
            maxLength={2000}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva um comentário"
            className="w-full resize-none rounded-lg border border-border bg-surface p-3.5 text-[15px] text-ink placeholder:text-placeholder focus:border-navy focus:outline-none"
          />
          <Button type="submit" size="sm" disabled={busy || !content.trim()}>
            Comentar
          </Button>
        </div>
      </form>
    </section>
  );
}
