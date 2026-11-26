"use client";

import { useCallback, useEffect, useState } from "react";
import { api, toApiError } from "@/lib/api";
import { updateCardSummaryInState } from "@/lib/board-state";
import type { CardDetail } from "@/lib/types";
import { Spinner } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { updateBoard, useBoardContext } from "./BoardContext";
import { CardDetailBody } from "./CardDetailBody";

/** Modal "Detalhe do card" do protótipo (836px), aberto por `?card=` (RT-14). */
export function CardDetailDialog({ cardId }: { cardId: string | null }) {
  const { openCard } = useBoardContext();
  return (
    <Dialog
      open={cardId !== null}
      onClose={() => openCard(null)}
      label="Detalhe do card"
      widthClass="w-[836px]"
    >
      {cardId ? <CardDetailLoader key={cardId} cardId={cardId} /> : null}
    </Dialog>
  );
}

function CardDetailLoader({ cardId }: { cardId: string }) {
  const { setData, reload, openCard } = useBoardContext();
  const toast = useToast();
  const [detail, setDetail] = useState<CardDetail | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await api.get<CardDetail>(`/cards/${cardId}`);
      setDetail(response.data);
    } catch (cause) {
      const apiError = toApiError(cause);
      if (apiError.status === 404) {
        // Card excluído por outra pessoa, ou sem acesso (CB-07, CB-08).
        toast("Card não encontrado. Ele pode ter sido excluído.", "error");
        openCard(null);
        await reload();
      } else {
        toast(apiError.message, "error");
      }
    }
  }, [cardId, openCard, reload, toast]);

  useEffect(() => {
    load();
  }, [load]);

  /** Mantém o painel e o resumo do card no quadro em sincronia. */
  const applyDetail = useCallback(
    (next: CardDetail) => {
      setDetail(next);
      updateBoard(setData, (board) => ({
        ...board,
        lists: updateCardSummaryInState(board.lists, next.id, {
          title: next.title,
          completed: next.completed,
          dueDate: next.dueDate,
          hasDescription: next.hasDescription,
          labelIds: next.labelIds,
          assigneeIds: next.assigneeIds,
          progress: next.progress,
          commentCount: next.commentCount,
        }),
      }));
    },
    [setData],
  );

  if (!detail) {
    return (
      <div className="flex justify-center py-16 text-muted">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return <CardDetailBody detail={detail} onChange={applyDetail} />;
}
