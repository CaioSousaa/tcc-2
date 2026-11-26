"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { plural } from "@/lib/format";
import type { BoardListData } from "@/lib/types";

interface DeleteListModalProps {
  boardId: string;
  list: BoardListData;
  lists: BoardListData[];
  onClose: () => void;
  onDeleted: () => void;
}

type Strategy = "move" | "delete";

export function DeleteListModal({ boardId, list, lists, onClose, onDeleted }: DeleteListModalProps) {
  const targets = lists.filter((l) => l.id !== list.id);
  const cards = plural(list.cardCount, "card", "cards");
  const hasCards = list.cardCount > 0;

  const [strategy, setStrategy] = useState<Strategy>(targets.length > 0 ? "move" : "delete");
  const [targetId, setTargetId] = useState(targets[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      const params = hasCards && strategy === "move" ? { targetListId: targetId } : {};
      await api.delete(`/boards/${boardId}/lists/${list.id}`, { params });
      onDeleted();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  const option = (value: Strategy, title: string, description: string, extra?: React.ReactNode, disabled = false) => {
    const selected = strategy === value;
    return (
      <label
        className={`flex gap-3.5 rounded-[10px] border px-[18px] py-4 ${
          disabled ? "cursor-not-allowed bg-surface-alt opacity-70" : "cursor-pointer bg-white"
        } ${selected ? "border-navy" : "border-border"}`}
      >
        <input
          type="radio"
          name="strategy"
          className="sr-only"
          checked={selected}
          disabled={disabled}
          onChange={() => setStrategy(value)}
        />
        <span className="pt-0.5">
          <span
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border bg-white ${
              selected ? "border-navy" : "border-[#B8BEC9]"
            }`}
          >
            {selected && <span className="h-[9px] w-[9px] rounded-full bg-navy" />}
          </span>
        </span>
        <span className="flex flex-1 flex-col gap-1.5">
          <span className="text-[15.5px] font-medium text-ink">{title}</span>
          <span className="text-[13.5px] text-muted">{description}</span>
          {extra}
        </span>
      </label>
    );
  };

  return (
    <Modal onClose={onClose} width={506}>
      <div className="flex gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg text-red">
          <TriangleAlert size={18} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-ink">Excluir a lista “{list.name}”?</h2>
          <p className="text-[15px] text-muted">
            {hasCards
              ? `Ela contém ${cards}. Escolha o que deve acontecer com ${list.cardCount === 1 ? "ele" : "eles"}.`
              : "A lista está vazia e será removida do quadro."}
          </p>
        </div>
      </div>

      {hasCards && (
        <div className="flex flex-col gap-2.5">
          {option(
            "move",
            "Mover os cards para outra lista",
            targets.length > 0 ? "Recomendado. Nenhum card é perdido." : "Não há outra lista no quadro.",
            targets.length > 0 && (
              <Select
                value={targetId}
                disabled={strategy !== "move"}
                onChange={(e) => setTargetId(e.target.value)}
                className="mt-1 h-10 max-w-[253px]"
              >
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name}
                  </option>
                ))}
              </Select>
            ),
            targets.length === 0,
          )}
          {option(
            "delete",
            "Excluir a lista e todos os cards",
            `Ação irreversível: ${cards}, checklists e comentários serão apagados.`,
          )}
        </div>
      )}

      <FormError message={error} />
      <div className="flex justify-end gap-2.5 pt-1.5">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" loading={loading} onClick={confirm}>
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}
