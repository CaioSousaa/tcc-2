"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { BoardSummary, Member, Role } from "@/lib/types";

export function useBoards() {
  return useQuery({
    queryKey: queryKeys.boards,
    queryFn: async () => (await api.get<{ items: BoardSummary[] }>("/boards")).data.items,
  });
}

export interface BoardInput {
  name: string;
  description?: string | null;
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BoardInput) => (await api.post<BoardSummary>("/boards", input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.boards }),
  });
}

export function useUpdateBoard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BoardInput) =>
      (await api.patch<BoardSummary>(`/boards/${boardId}`, input)).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
      void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/boards/${boardId}`);
    },
    onSuccess: (_data, boardId) => {
      queryClient.removeQueries({ queryKey: queryKeys.board(boardId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
    },
  });
}

export function useMembers(boardId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.members(boardId),
    queryFn: async () => (await api.get<{ items: Member[] }>(`/boards/${boardId}/members`)).data.items,
    enabled,
  });
}

function useMembersInvalidation(boardId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.members(boardId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.board(boardId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.boards });
  };
}

export function useInviteMember(boardId: string) {
  const invalidate = useMembersInvalidation(boardId);
  return useMutation({
    mutationFn: async (input: { email: string; role: Role }) =>
      (await api.post<Member>(`/boards/${boardId}/members`, input)).data,
    onSuccess: invalidate,
  });
}

export function useChangeMemberRole(boardId: string) {
  const invalidate = useMembersInvalidation(boardId);
  return useMutation({
    mutationFn: async (input: { userId: string; role: Role }) =>
      (await api.patch<Member>(`/boards/${boardId}/members/${input.userId}`, { role: input.role })).data,
    onSuccess: invalidate,
    onError: invalidate,
  });
}

export function useRemoveMember(boardId: string) {
  const invalidate = useMembersInvalidation(boardId);
  return useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/boards/${boardId}/members/${userId}`);
    },
    onSuccess: invalidate,
    onError: invalidate,
  });
}
