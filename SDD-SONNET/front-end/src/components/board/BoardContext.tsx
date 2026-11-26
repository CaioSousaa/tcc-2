"use client";

import { createContext, useContext, type Dispatch, type SetStateAction } from "react";
import type { BoardFilters } from "@/lib/filters";
import type { BoardFull, Role } from "@/lib/types";

export interface BoardContextValue {
  boardId: string;
  data: BoardFull;
  setData: Dispatch<SetStateAction<BoardFull | null>>;
  reload: () => Promise<void>;
  role: Role;
  /** Abre o card no painel de detalhes (reflete em `?card=`), ou fecha com `null` (RT-14). */
  openCard: (cardId: string | null) => void;
  /** Filtro de visualização em vigor (já sem etiquetas inexistentes). */
  filters: BoardFilters;
  /** "Hoje" local, usado para calcular atraso. */
  today: string;
  /** Visualização ordenada por prazo (só leitura, sem arrastar). */
  sortByDue: boolean;
  /** Arrastar fica desligado com filtro ou ordenação, pois os índices da tela não são os reais. */
  dragDisabled: boolean;
}

export const BoardContext = createContext<BoardContextValue | null>(null);

export function useBoardContext(): BoardContextValue {
  const value = useContext(BoardContext);
  if (!value) throw new Error("useBoardContext fora de BoardContext");
  return value;
}

/** Atualiza o quadro em memória; ignora se ainda não carregou. */
export function updateBoard(
  setData: BoardContextValue["setData"],
  updater: (board: BoardFull) => BoardFull,
) {
  setData((current) => (current ? updater(current) : current));
}
