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
    <section aria-labelledby="comments-heading" className="space-y-3">
      <h3 id="comments-heading" className="text-sm font-semibold text-slate-800">
        Comentários
      </h3>

      {comments.isPending && <Spinner />}
      {comments.isError && <Alert>{errorMessage(comments.error)}</Alert>}
      {comments.data && comments.data.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum comentário ainda.</p>
      )}

      {comments.data && comments.data.length > 0 && (
        <ol className="space-y-3">
          {comments.data.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <Avatar name={comment.author.name} size="md" />
              <div className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                <p className="text-xs text-slate-500">
                  <strong className="font-semibold text-slate-800">{comment.author.name}</strong>
                  {" · "}
                  <time dateTime={comment.createdAt}>{formatTimestamp(comment.createdAt)}</time>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-800">{comment.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canComment ? (
        <form onSubmit={submit} noValidate className="space-y-2">
          <textarea
            aria-label="Novo comentário"
            rows={3}
            value={body}
            maxLength={2000}
            placeholder="Escreva um comentário…"
            onChange={(event) => setBody(event.target.value)}
            className="block w-full rounded-md border-0 bg-white p-2 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
          />
          {error && (
            <p role="alert" className="text-xs text-red-600">
              {error.fields.body ?? error.message}
            </p>
          )}
          <Button type="submit" size="sm" loading={addComment.isPending}>
            Comentar
          </Button>
        </form>
      ) : (
        <p className="text-xs text-slate-500">Observadores podem ler os comentários, mas não comentar.</p>
      )}
    </section>
  );
}
