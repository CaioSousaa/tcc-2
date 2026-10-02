import type { Comment } from "./types";

/** Novo comentário vai ao final: o histórico é cronológico crescente (RN-30, CA-69). */
export function appendComment(comments: Comment[], comment: Comment): Comment[] {
  return [...comments, comment];
}

/** Ordena do mais antigo ao mais recente; empate por `id`, igual ao servidor (RT-28). */
export function sortChronological(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => {
    const byTime = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}
