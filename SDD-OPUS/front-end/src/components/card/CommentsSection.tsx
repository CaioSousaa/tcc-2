"use client";

import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { errorMessage, parseApiError } from "@/lib/api";
import { useAddComment, useComments } from "@/lib/card";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Comment history, oldest first, with author and time. Immutable: no edit or delete (CM1–CM3). */
export function CommentsSection({ cardId, canComment }: { cardId: string; canComment: boolean }) {
  const comments = useComments(cardId);
  const addComment = useAddComment(cardId);
  const [body, setBody] = useState("");

  const error = addComment.isError ? parseApiError(addComment.error) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    addComment.mutate(body, { onSuccess: () => setBody("") });
  }

  return (
    <section aria-labelledby="comments-heading" className="flex flex-col gap-4">
      <h3 id="comments-heading" className="text-[13.5px] font-medium text-body">
        Comentários
      </h3>

      {comments.isPending && <Spinner />}
      {comments.isError && <Alert>{errorMessage(comments.error)}</Alert>}
      {comments.data && comments.data.length === 0 && (
        <p className="text-[14px] text-muted">Nenhum comentário ainda.</p>
      )}

      {comments.data && comments.data.length > 0 && (
        <ol className="flex flex-col gap-4">
          {comments.data.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar name={comment.author.name} seed={comment.author.id} size="md" ring={false} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2">
                  <strong className="text-[15px] font-semibold text-ink">{comment.author.name}</strong>
                  <time dateTime={comment.createdAt} className="text-[12.5px] text-muted">
                    {formatTimestamp(comment.createdAt)}
                  </time>
                </p>
                <p className="text-[15px] leading-[23px] whitespace-pre-wrap break-words text-body">{comment.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canComment ? (
        <form onSubmit={submit} noValidate className="flex flex-col items-start gap-2.5">
          <textarea
            aria-label="Novo comentário"
            rows={3}
            value={body}
            maxLength={2000}
            placeholder="Escreva um comentário"
            onChange={(event) => setBody(event.target.value)}
            className="block w-full rounded-lg border border-line bg-surface p-3.5 text-[15px] text-ink outline-none focus:border-navy"
          />
          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error.fields.body ?? error.message}
            </p>
          )}
          <Button type="submit" size="sm" loading={addComment.isPending}>
            Comentar
          </Button>
        </form>
      ) : (
        <p className="text-[13.5px] text-muted">Observadores podem ler os comentários, mas não comentar.</p>
      )}
    </section>
  );
}
