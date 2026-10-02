"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { api, toApiError } from "@/lib/api";
import type { ListWithCards } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Dialog, ModalBody, ModalFooter } from "@/components/ui/Dialog";
import { RadioCard } from "@/components/ui/RadioCard";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useBoardContext } from "./BoardContext";

interface DeleteListDialogProps {
  list: ListWithCards | null;
  onClose: () => void;
}

/** Modal "Excluir lista" do protótipo, com as duas escolhas exigidas pela especificação (RF-14). */
export function DeleteListDialog({ list, onClose }: DeleteListDialogProps) {
  return (
    <Dialog open={list !== null} onClose={onClose} label="Excluir lista" widthClass="w-[506px]">
      {list ? <DeleteListContent key={list.id} list={list} onClose={onClose} /> : null}
    </Dialog>
  );
}

function DeleteListContent({ list, onClose }: { list: ListWithCards; onClose: () => void }) {
  const { data, reload } = useBoardContext();
  const toast = useToast();
  const others = data.lists.filter((item) => item.id !== list.id);
  const cardCount = list.cards.length;
  const canMove = others.length > 0;

  const [choice, setChoice] = useState<"move" | "delete">(canMove ? "move" : "delete");
  const [targetId, setTargetId] = useState(others[0]?.id ?? "");
  const [pending, setPending] = useState(false);

  async function confirm() {
    setPending(true);
    try {
      await api.delete(`/lists/${list.id}`, {
        params:
          cardCount === 0
            ? undefined
            : choice === "move"
              ? { strategy: "move", targetListId: targetId }
              : { strategy: "delete" },
      });
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    } finally {
      onClose();
      await reload();
    }
  }

  const cardsText = cardCount === 1 ? "1 card" : `${cardCount} cards`;

  return (
    <ModalBody>
      <div className="flex gap-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-bg text-red">
          <TriangleAlert size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-xl font-bold tracking-[-0.2px] text-ink">
            Excluir a lista “{list.name}”?
          </h2>
          <p className="text-[15px] leading-normal text-muted">
            {cardCount === 0
              ? "A lista está vazia."
              : `Ela contém ${cardsText}. Escolha o que deve acontecer com ${cardCount === 1 ? "ele" : "eles"}.`}
          </p>
        </div>
      </div>

      {cardCount > 0 ? (
        <div className="space-y-2.5">
          {canMove ? (
            <RadioCard
              name="delete-choice"
              checked={choice === "move"}
              onSelect={() => setChoice("move")}
              title="Mover os cards para outra lista"
              description="Recomendado. Nenhum card é perdido."
            >
              <Select
                id="move-target"
                aria-label="Lista de destino"
                compact
                wrapperClassName="max-w-[253px] pt-1"
                value={targetId}
                disabled={choice !== "move"}
                onChange={(event) => setTargetId(event.target.value)}
              >
                {others.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </RadioCard>
          ) : null}
          <RadioCard
            name="delete-choice"
            checked={choice === "delete"}
            onSelect={() => setChoice("delete")}
            title="Excluir a lista e todos os cards"
            description={`Ação irreversível: ${cardsText}, checklists e comentários serão apagados.`}
          />
        </div>
      ) : null}

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={confirm} loading={pending}>
          Confirmar
        </Button>
      </ModalFooter>
    </ModalBody>
  );
}
