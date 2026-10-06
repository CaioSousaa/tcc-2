"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { CardDetail, Checklist, ChecklistItem, Comment, Label, Progress } from "@/lib/types";

export function useCardDetail(cardId: string | null) {
  return useQuery({
    queryKey: queryKeys.card(cardId ?? ""),
    queryFn: async () => (await api.get<CardDetail>(`/cards/${cardId}`)).data,
    enabled: cardId !== null,
  });
}

/** After any change to a card: refresh its detail and the board (summary badges, ordering). */
function useRefreshCard(boardId: string, cardId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.card(cardId) });
    return queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
  };
}

export interface CardPatch {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  completed?: boolean;
}

export function useUpdateCard(boardId: string, cardId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (patch: CardPatch) => (await api.patch<CardDetail>(`/cards/${cardId}`, patch)).data,
    onSuccess: (card) => queryClient.setQueryData(queryKeys.card(cardId), card),
    onSettled: refresh,
  });
}

export function useDeleteCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cardId: string) => {
      await api.delete(`/cards/${cardId}`);
    },
    // The deleted card's own cache entry is simply left unused: removing it would make the open
    // modal refetch and flash a "card not found" before it closes.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) }),
  });
}

// ── Checklists ──────────────────────────────────────────────────────────────

export function useCreateChecklist(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (title: string) =>
      (await api.post<Checklist>(`/cards/${cardId}/checklists`, { title })).data,
    onSettled: refresh,
  });
}

export function useRenameChecklist(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (input: { checklistId: string; title: string }) =>
      (await api.patch<Checklist>(`/checklists/${input.checklistId}`, { title: input.title })).data,
    onSettled: refresh,
  });
}

export function useDeleteChecklist(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (checklistId: string) =>
      (await api.delete<{ progress: Progress }>(`/checklists/${checklistId}`)).data,
    onSettled: refresh,
  });
}

export function useCreateItem(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (input: { checklistId: string; text: string }) =>
      (await api.post<{ item: ChecklistItem; progress: Progress }>(`/checklists/${input.checklistId}/items`, { text: input.text })).data,
    onSettled: refresh,
  });
}

export function useUpdateItem(boardId: string, cardId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (input: { itemId: string; text?: string; checked?: boolean }) =>
      (await api.patch<{ item: ChecklistItem; progress: Progress }>(`/checklist-items/${input.itemId}`, {
        ...(input.text !== undefined ? { text: input.text } : {}),
        ...(input.checked !== undefined ? { checked: input.checked } : {}),
      })).data,
    // Ticking a box feels instant: patch the cached card, then let the refetch confirm.
    onMutate: async (input) => {
      if (input.checked === undefined) return;
      await queryClient.cancelQueries({ queryKey: queryKeys.card(cardId) });
      queryClient.setQueryData<CardDetail>(queryKeys.card(cardId), (card) => {
        if (!card) return card;
        const checklists = card.checklists.map((checklist) => ({
          ...checklist,
          items: checklist.items.map((item) =>
            item.id === input.itemId ? { ...item, checked: input.checked! } : item,
          ),
        }));
        const items = checklists.flatMap((checklist) => checklist.items);
        return {
          ...card,
          checklists,
          checklistChecked: items.filter((item) => item.checked).length,
          checklistTotal: items.length,
        };
      });
    },
    onSettled: refresh,
  });
}

export function useDeleteItem(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (itemId: string) =>
      (await api.delete<{ progress: Progress }>(`/checklist-items/${itemId}`)).data,
    onSettled: refresh,
  });
}

// ── Labels ──────────────────────────────────────────────────────────────────

/** Board-level label changes touch every card, so refresh the board and any open card. */
function useRefreshLabels(boardId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["card"] });
    return queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
  };
}

export function useCreateLabel(boardId: string) {
  const refresh = useRefreshLabels(boardId);
  return useMutation({
    mutationFn: async (input: { name: string; color: string }) =>
      (await api.post<Label>(`/boards/${boardId}/labels`, input)).data,
    onSettled: refresh,
  });
}

export function useUpdateLabel(boardId: string) {
  const refresh = useRefreshLabels(boardId);
  return useMutation({
    mutationFn: async (input: { labelId: string; name?: string; color?: string }) =>
      (await api.patch<Label>(`/labels/${input.labelId}`, { name: input.name, color: input.color })).data,
    onSettled: refresh,
  });
}

export function useDeleteLabel(boardId: string) {
  const refresh = useRefreshLabels(boardId);
  return useMutation({
    mutationFn: async (labelId: string) => {
      await api.delete(`/labels/${labelId}`);
    },
    onSettled: refresh,
  });
}

export function useToggleCardLabel(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (input: { labelId: string; apply: boolean }) => {
      if (input.apply) await api.put(`/cards/${cardId}/labels/${input.labelId}`);
      else await api.delete(`/cards/${cardId}/labels/${input.labelId}`);
    },
    onSettled: refresh,
  });
}

// ── Assignees ───────────────────────────────────────────────────────────────

export function useToggleAssignee(boardId: string, cardId: string) {
  const refresh = useRefreshCard(boardId, cardId);
  return useMutation({
    mutationFn: async (input: { userId: string; assign: boolean }) => {
      if (input.assign) await api.put(`/cards/${cardId}/assignees/${input.userId}`);
      else await api.delete(`/cards/${cardId}/assignees/${input.userId}`);
    },
    onSettled: refresh,
  });
}

// ── Comments ────────────────────────────────────────────────────────────────

export function useComments(cardId: string) {
  return useQuery({
    queryKey: queryKeys.comments(cardId),
    queryFn: async () => (await api.get<{ items: Comment[] }>(`/cards/${cardId}/comments`)).data.items,
  });
}

export function useAddComment(cardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => (await api.post<Comment>(`/cards/${cardId}/comments`, { body })).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.comments(cardId) }),
  });
}
