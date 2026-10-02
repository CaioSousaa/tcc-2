import type { Member } from "./types";

/** Inclui ou retira o membro da lista de responsáveis, sem duplicar (RF-29, RT-36). */
export function toggleAssignee(assigneeIds: string[], userId: string): string[] {
  return assigneeIds.includes(userId)
    ? assigneeIds.filter((id) => id !== userId)
    : [...assigneeIds, userId];
}

/** Membros responsáveis, na ordem da lista de membros; ignora quem já saiu do quadro (RN-24). */
export function assigneeMembers(members: Member[], assigneeIds: string[]): Member[] {
  return members.filter((member) => assigneeIds.includes(member.userId));
}
