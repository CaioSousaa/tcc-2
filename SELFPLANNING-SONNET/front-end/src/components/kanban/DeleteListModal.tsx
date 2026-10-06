"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Select } from "@/components/ui/Field";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { ListWithCards } from "@/lib/types";

function Radio({ checked, danger = false }: { checked: boolean; danger?: boolean }) {
  return (
    <span
      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border bg-surface ${
        checked ? (danger ? "border-red-dark" : "border-navy") : "border-[#B8BEC9]"
      }`}
    >
      {checked && (
        <span className={`h-[9px] w-[9px] rounded-full ${danger ? "bg-red-dark" : "bg-navy"}`} />
      )}
    </span>
  );
}

export function DeleteListModal({
  list,
  otherLists,
  onClose,
  onDeleted,
}: {
  list: ListWithCards;
  otherLists: ListWithCards[];
  onClose: () => void;
  onDeleted: () => void;
}) {
  const cardCount = list.cards.length;
  const canMove = otherLists.length > 0;
  const [strategy, setStrategy] = useState<"delete" | "move">(canMove ? "move" : "delete");
  const [targetId, setTargetId] = useState(otherLists[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (cardCount > 0) {
        params.strategy = strategy;
        if (strategy === "move") params.targetListId = targetId;
      }
      await api.delete(`/lists/${list.id}`, { params });
      onDeleted();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const invalid = cardCount > 0 && strategy === "move" && !targetId;

  return (
    <Modal onClose={onClose} width={506}>
      <div className="flex gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg text-red">
          <TriangleAlert size={18} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-[-0.2px] text-ink">
            Excluir a lista “{list.name}”?
          </h2>
          <p className="text-[15px] leading-[23px] text-muted">
            {cardCount === 0
              ? "A lista está vazia."
              : `Ela contém ${cardCount} ${cardCount === 1 ? "card" : "cards"}. Escolha o que deve acontecer com ${cardCount === 1 ? "ele" : "eles"}.`}
          </p>
        </div>
      </div>

      {cardCount > 0 && (
        <div className="flex flex-col gap-2.5">
          <div
            role="radio"
            aria-checked={strategy === "move"}
            aria-disabled={!canMove}
            tabIndex={0}
            onClick={() => canMove && setStrategy("move")}
            onKeyDown={(e) => e.key === " " && canMove && setStrategy("move")}
            className={`flex gap-3.5 rounded-[10px] border border-border bg-surface px-[18px] py-4 ${
              canMove ? "cursor-pointer" : "opacity-60"
            }`}
          >
            <Radio checked={strategy === "move"} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[15.5px] font-medium text-ink">
                Mover os cards para outra lista
              </span>
              <span className="text-[13.5px] leading-[19px] text-muted">
                Recomendado. Nenhum card é perdido.
              </span>
              <div className="w-[253px] max-w-full" onClick={(e) => e.stopPropagation()}>
                <Select
                  value={targetId}
                  disabled={strategy !== "move" || !canMove}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="h-10"
                >
                  {otherLists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div
            role="radio"
            aria-checked={strategy === "delete"}
            tabIndex={0}
            onClick={() => setStrategy("delete")}
            onKeyDown={(e) => e.key === " " && setStrategy("delete")}
            className="flex cursor-pointer gap-3.5 rounded-[10px] border border-border bg-surface px-[18px] py-4"
          >
            <Radio checked={strategy === "delete"} danger />
            <div className="flex flex-col gap-1.5">
              <span className="text-[15.5px] font-medium text-ink">
                Excluir a lista e todos os cards
              </span>
              <span className="text-[13.5px] leading-[19px] text-muted">
                Ação irreversível: {cardCount} {cardCount === 1 ? "card" : "cards"}, checklists e
                comentários serão apagados.
              </span>
            </div>
          </div>

          <div
            role="radio"
            aria-checked={false}
            aria-disabled
            className="flex gap-3.5 rounded-[10px] border border-border bg-surface-alt px-[18px] py-4 opacity-60"
          >
            <Radio checked={false} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[15.5px] font-medium text-ink">
                Bloquear exclusão enquanto houver cards
              </span>
              <span className="text-[13.5px] leading-[19px] text-muted">
                Regra definida pelo administrador do quadro.
              </span>
            </div>
          </div>
        </div>
      )}

      <FormError message={error} />
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={confirm} disabled={busy || invalid}>
          Confirmar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
