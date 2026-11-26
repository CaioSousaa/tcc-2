"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, toApiError, type ApiError } from "./api";
import type { BoardFull } from "./types";

/**
 * Carrega o quadro completo e o recarrega ao voltar o foco para a aba (RT-18).
 * Quadro inexistente ou sem acesso leva à lista de quadros (CB-13, CB-21).
 */
export function useBoard(boardId: string, onGone: (message: string) => void) {
  const router = useRouter();
  const [data, setData] = useState<BoardFull | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const goneRef = useRef(onGone);
  goneRef.current = onGone;

  const reload = useCallback(async () => {
    try {
      const response = await api.get<BoardFull>(`/boards/${boardId}`);
      setData(response.data);
      setError(null);
    } catch (cause) {
      const apiError = toApiError(cause);
      if (apiError.status === 404) {
        goneRef.current("Quadro não encontrado ou você perdeu o acesso a ele.");
        router.replace("/");
        return;
      }
      setError(apiError);
    }
  }, [boardId, router]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [reload]);

  return { data, setData, error, reload };
}
