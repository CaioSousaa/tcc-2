"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import type { BoardList } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Radio } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

type Strategy = "move" | "delete";

interface DeleteListModalProps {
  open: boolean;
  list: BoardList | null;
  lists: BoardList[];
  blockNonEmpty: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

/**
 * Exclusão de lista com regra explícita para os cards:
 * mover para outra lista (recomendado), excluir tudo, ou bloqueio pela regra
 * do quadro (definida pelo administrador nas configurações do quadro).
 */
export function DeleteListModal({
  open,
  list,
  lists,
  blockNonEmpty,
  onClose,
  onDeleted,
}: DeleteListModalProps) {
  const targets = lists.filter((l) => l.id !== list?.id);
  const cardCount = list?.cards.length ?? 0;
  const hasCards = cardCount > 0;
  const blocked = hasCards && blockNonEmpty;

  const [strategy, setStrategy] = useState<Strategy>("move");
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStrategy(targets.length > 0 ? "move" : "delete");
    setTargetId(targets[targets.length - 1]?.id ?? "");
    setError(null);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, list?.id]);

  if (!list) return null;

  const cardsText = `${cardCount} ${cardCount === 1 ? "card" : "cards"}`;

  async function confirm() {
    if (!list) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (hasCards) {
        params.strategy = strategy;
        if (strategy === "move") params.targetListId = targetId;
      }
      await api.delete(`/lists/${list.id}`, { params });
      onDeleted();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  const optionClass = (active: boolean, disabled: boolean) =>
    `flex gap-3.5 rounded-[10px] border px-[18px] py-4 text-left transition-colors ${
      disabled
        ? "cursor-not-allowed border-border bg-surface-alt opacity-60"
        : active
          ? "cursor-pointer border-navy bg-surface"
          : "cursor-pointer border-border bg-surface hover:border-muted"
    }`;

  return (
    <Modal open={open} onClose={onClose} width={506}>
      <div className="flex gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg">
          <TriangleAlert className="size-[18px] text-red" />
        </span>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-[-0.2px] text-ink">
            Excluir a lista “{list.title}”?
          </h2>
          <p className="text-[15px] leading-[1.5] text-muted">
            {hasCards
              ? `Ela contém ${cardsText}. Escolha o que deve acontecer com eles.`
              : "A lista está vazia e será removida do quadro."}
          </p>
        </div>
      </div>

      {hasCards && (
        <div className="flex flex-col gap-2.5">
          <div
            role="radio"
            aria-checked={strategy === "move" && !blocked}
            aria-disabled={blocked || targets.length === 0}
            className={optionClass(strategy === "move" && !blocked, blocked || targets.length === 0)}
            onClick={() => !blocked && targets.length > 0 && setStrategy("move")}
          >
            <span className="pt-0.5">
              <Radio checked={strategy === "move" && !blocked} />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="text-[15.5px] font-medium text-ink">Mover os cards para outra lista</span>
              <span className="text-[13.5px] leading-[1.4] text-muted">
                {targets.length > 0
                  ? "Recomendado. Nenhum card é perdido."
                  : "Não há outra lista no quadro para receber os cards."}
              </span>
              {targets.length > 0 && (
                <Select
                  wrapperClassName="mt-1 w-[253px]"
                  selectSize="sm"
                  value={targetId}
                  disabled={blocked}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    setStrategy("move");
                  }}
                >
                  {targets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.title}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          <div
            role="radio"
            aria-checked={strategy === "delete" && !blocked}
            aria-disabled={blocked}
            className={optionClass(strategy === "delete" && !blocked, blocked)}
            onClick={() => !blocked && setStrategy("delete")}
          >
            <span className="pt-0.5">
              <Radio checked={strategy === "delete" && !blocked} />
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[15.5px] font-medium text-ink">Excluir a lista e todos os cards</span>
              <span className="text-[13.5px] leading-[1.4] text-muted">
                Ação irreversível: {cardsText}, checklists e comentários serão apagados.
              </span>
            </div>
          </div>

          <div
            role="radio"
            aria-checked={blocked}
            aria-disabled={!blocked}
            className={`flex gap-3.5 rounded-[10px] border px-[18px] py-4 ${
              blocked ? "border-navy bg-surface" : "border-border bg-surface-alt opacity-60"
            }`}
          >
            <span className="pt-0.5">
              <Radio checked={blocked} />
            </span>
            <div className="flex flex-col gap-1.5">
              <span className="text-[15.5px] font-medium text-ink">Bloquear exclusão enquanto houver cards</span>
              <span className="text-[13.5px] leading-[1.4] text-muted">
                {blocked
                  ? "Regra ativa neste quadro: mova ou exclua os cards antes de excluir a lista."
                  : "Regra definida pelo administrador do quadro (desativada)."}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>}

      <div className="flex justify-end gap-2.5 pt-1.5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="danger"
          onClick={confirm}
          loading={loading}
          disabled={blocked || (hasCards && strategy === "move" && !targetId)}
        >
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}
