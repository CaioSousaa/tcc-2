"use client";

import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import type { BoardList } from "@/lib/types";

export type DeleteListChoice =
  | { cardsAction: "move"; targetListId: string }
  | { cardsAction: "delete" }
  | { cardsAction: null };

interface DeleteListModalProps {
  open: boolean;
  list: BoardList | null;
  lists: BoardList[];
  /** Board rule: lists that still have cards cannot be deleted. */
  blockWithCards: boolean;
  onClose: () => void;
  onConfirm: (choice: DeleteListChoice) => Promise<void>;
}

type Option = "move" | "delete" | "block";

function OptionCard({
  selected,
  disabled,
  onSelect,
  title,
  description,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={`flex gap-3.5 rounded-xl border p-4 ${
        disabled
          ? "cursor-not-allowed border-border bg-surface-alt opacity-70"
          : selected
            ? "cursor-pointer border-navy/40 bg-surface"
            : "cursor-pointer border-border bg-surface hover:border-[#C9CED7]"
      }`}
    >
      <input
        type="radio"
        className="peer sr-only"
        checked={selected}
        disabled={disabled}
        onChange={onSelect}
      />
      <span
        aria-hidden
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          selected ? "border-navy" : "border-[#B8BEC9]"
        }`}
      >
        {selected && <span className="size-2.5 rounded-full bg-navy" />}
      </span>
      <span className="flex-1">
        <span className="block text-[16px] font-medium text-ink">{title}</span>
        <span className="mt-1 block text-[13.5px] leading-snug text-muted">{description}</span>
        {children}
      </span>
    </label>
  );
}

export function DeleteListModal({
  open,
  list,
  lists,
  blockWithCards,
  onClose,
  onConfirm,
}: DeleteListModalProps) {
  const others = lists.filter((item) => item.id !== list?.id);
  const cardCount = list?.cards.length ?? 0;
  const hasCards = cardCount > 0;

  const [option, setOption] = useState<Option>("move");
  const [targetListId, setTargetListId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOption(blockWithCards ? "block" : others.length > 0 ? "move" : "delete");
    setTargetListId(others[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, list?.id, blockWithCards]);

  if (!list) return null;

  const cardsText = `${cardCount} ${cardCount === 1 ? "card" : "cards"}`;
  const blocked = hasCards && option === "block";

  async function confirm() {
    setSaving(true);
    try {
      if (!hasCards) await onConfirm({ cardsAction: null });
      else if (option === "move") await onConfirm({ cardsAction: "move", targetListId });
      else if (option === "delete") await onConfirm({ cardsAction: "delete" });
    } catch {
      // Reported by the caller.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} width={506} bare>
      <div className="p-[26px]">
        <div className="flex gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-bg text-red">
            <TriangleAlert size={18} />
          </span>
          <div>
            <h2 className="text-[20px] font-bold text-ink">Excluir a lista “{list.title}”?</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              {hasCards
                ? `Ela contém ${cardsText}. Escolha o que deve acontecer com ${cardCount === 1 ? "ele" : "eles"}.`
                : "A lista está vazia e será removida do quadro."}
            </p>
          </div>
        </div>

        {hasCards && (
          <div className="mt-6 flex flex-col gap-2.5">
            <OptionCard
              selected={option === "move"}
              disabled={blockWithCards || others.length === 0}
              onSelect={() => setOption("move")}
              title="Mover os cards para outra lista"
              description={
                others.length === 0
                  ? "Não há outra lista no quadro para receber os cards."
                  : "Recomendado. Nenhum card é perdido."
              }
            >
              {option === "move" && others.length > 0 && (
                <Select
                  className="mt-3 max-w-[254px]"
                  value={targetListId}
                  aria-label="Lista de destino"
                  onChange={(event) => setTargetListId(event.target.value)}
                >
                  {others.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              )}
            </OptionCard>
            <OptionCard
              selected={option === "delete"}
              disabled={blockWithCards}
              onSelect={() => setOption("delete")}
              title="Excluir a lista e todos os cards"
              description={`Ação irreversível: ${cardsText}, checklists e comentários serão apagados.`}
            />
            <OptionCard
              selected={option === "block"}
              disabled={!blockWithCards}
              onSelect={() => setOption("block")}
              title="Bloquear exclusão enquanto houver cards"
              description={
                blockWithCards
                  ? "Regra ativa neste quadro: mova ou exclua os cards antes de excluir a lista."
                  : "Regra definida pelo administrador do quadro (nas configurações do quadro)."
              }
            />
          </div>
        )}

        <div className="mt-7 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={confirm}
            loading={saving}
            disabled={blocked || (option === "move" && hasCards && !targetListId)}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
