"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { BoardDetail, BoardList, CardSummary } from "@/lib/types";

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: queryKeys.board(boardId),
    queryFn: async () => (await api.get<BoardDetail>(`/boards/${boardId}`)).data,
  });
}

/** Re-reads the board. Every board mutation settles through this, so a failure (including
 *  "the item was deleted meanwhile", B7) always ends with the screen matching the server. */
export function useRefreshBoard(boardId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
}

export function useCreateList(boardId: string) {
  const refresh = useRefreshBoard(boardId);
  return useMutation({
    mutationFn: async (name: string) =>
      (await api.post<BoardList>(`/boards/${boardId}/lists`, { name })).data,
    onSettled: refresh,
  });
}

export function useRenameList(boardId: string) {
  const refresh = useRefreshBoard(boardId);
  return useMutation({
    mutationFn: async (input: { listId: string; name: string }) =>
      (await api.patch<BoardList>(`/lists/${input.listId}`, { name: input.name })).data,
    onSettled: refresh,
  });
}

export function useDeleteList(boardId: string) {
  const refresh = useRefreshBoard(boardId);
  return useMutation({
    mutationFn: async (input: { listId: string; confirmCards: number }) => {
      await api.delete(`/lists/${input.listId}`, { params: { confirmCards: input.confirmCards } });
    },
    onSettled: refresh,
  });
}

export function useMoveList(boardId: string) {
  const refresh = useRefreshBoard(boardId);
  return useMutation({
    mutationFn: async (input: { listId: string; position: number }) =>
      (await api.post<{ orderedListIds: string[] }>(`/lists/${input.listId}/move`, { position: input.position })).data,
    onSettled: refresh,
  });
}

export function useCreateCard(boardId: string) {
  const refresh = useRefreshBoard(boardId);
  return useMutation({
    mutationFn: async (input: { listId: string; title: string }) =>
      (await api.post<CardSummary>(`/lists/${input.listId}/cards`, { title: input.title })).data,
    onSettled: refresh,
  });
}

export function useMoveCard(boardId: string) {
  const refresh = useRefreshBoard(boardId);
  return useMutation({
    mutationFn: async (input: { cardId: string; listId: string; position: number }) =>
      (await api.post(`/cards/${input.cardId}/move`, { listId: input.listId, position: input.position })).data,
    onSettled: refresh,
  });
}
