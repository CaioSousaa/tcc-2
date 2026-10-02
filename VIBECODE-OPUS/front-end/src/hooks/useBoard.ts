"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getApiError } from "@/lib/api";
import type { BoardDetail } from "@/lib/types";

export function useBoard(boardId: string) {
  const [data, setData] = useState<BoardDetail | null>(null);
  const [error, setError] = useState<{ status?: number; message?: string } | null>(
    null,
  );

  const reload = useCallback(async () => {
    try {
      const response = await api.get<BoardDetail>(`/boards/${boardId}`);
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(getApiError(err));
    }
  }, [boardId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, setData, error, reload };
}
