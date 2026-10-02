"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { User } from "@/lib/types";

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await api.get<{ user: User }>("/auth/me")).data.user,
    staleTime: 5 * 60 * 1000,
  });
}

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput) =>
      (await api.post<{ user: User }>("/auth/login", input)).data.user,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterInput) =>
      (await api.post<{ user: User }>("/auth/register", input)).data.user,
    onSuccess: (user) => queryClient.setQueryData(queryKeys.me, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      queryClient.clear();
      // Hard navigation: guarantees no stale in-memory data survives the logout (CA-C8).
      window.location.assign("/login");
    },
  });
}
