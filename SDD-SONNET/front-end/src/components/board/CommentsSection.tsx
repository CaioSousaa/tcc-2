"use client";

import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { appendComment } from "@/lib/comments";
import { LIMITS } from "@/lib/constants";
import { formatCommentTime } from "@/lib/date";
import type { CardDetail, Comment } from "@/lib/types";
import { validateText } from "@/lib/validation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export function CommentsSection({
  detail,
  canComment,
  onChange,
}: {
  detail: CardDetail;
  canComment: boolean;
  onChange: (next: CardDetail) => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const invalid = validateText(text, "Comentário", LIMITS.comment.min, LIMITS.comment.max);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await api.post<Comment>(`/cards/${detail.id}/comments`, { text });
      onChange({
        ...detail,
        comments: appendComment(detail.comments, response.data),
        commentCount: detail.commentCount + 1,
      });
      setText("");
    } catch (cause) {
      // O texto digitado é preservado em caso de erro (CA-71, CB-03).
      const apiError = toApiError(cause);
      setError(apiError.fieldMessage("text") ?? apiError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="comments-title" className="space-y-4">
      <h4 id="comments-title" className="text-[13.5px] font-medium text-body">
        Comentários
      </h4>

      {detail.comments.length === 0 ? (
        <p className="text-[15px] text-placeholder">Nenhum comentário ainda.</p>
      ) : (
        <ol className="space-y-4">
          {detail.comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar id={comment.author.id} name={comment.author.name} size={32} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="flex items-center gap-2">
                  <strong className="text-[15px] font-semibold text-ink">{comment.author.name}</strong>
                  <time dateTime={comment.createdAt} className="text-[12.5px] text-muted">
                    {formatCommentTime(comment.createdAt)}
                  </time>
                </p>
                <p className="whitespace-pre-wrap break-words text-[15px] leading-normal text-body">
                  {comment.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canComment ? (
        <form onSubmit={submit} noValidate className="flex gap-3">
          <Avatar id={user.id} name={user.name} size={32} />
          <div className="min-w-0 flex-1 space-y-2.5">
            <textarea
              rows={2}
              aria-label="Novo comentário"
              placeholder="Escreva um comentário"
              value={text}
              disabled={pending}
              onChange={(event) => setText(event.target.value)}
              className="block min-h-[66px] w-full rounded-lg border border-border bg-surface p-3.5 text-[15px] text-ink placeholder:text-placeholder focus:outline-2 focus:outline-navy"
            />
            {error ? (
              <p role="alert" className="text-[13px] text-red">
                {error}
              </p>
            ) : null}
            <Button type="submit" small loading={pending} className="px-4 text-[14.5px]">
              Comentar
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
