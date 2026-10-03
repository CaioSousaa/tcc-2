"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select, FormError } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { ListWithCards } from "@/lib/types";

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
    <Modal title="Excluir lista" onClose={onClose}>
      <div className="space-y-4 p-5">
        {cardCount === 0 ? (
          <p className="text-sm text-body">
            Excluir a lista <strong className="text-ink">{list.name}</strong>? Ela está vazia.
          </p>
        ) : (
          <>
            <p className="text-sm text-body">
              A lista <strong className="text-ink">{list.name}</strong> tem{" "}
              <strong className="text-ink">
                {cardCount} {cardCount === 1 ? "card" : "cards"}
              </strong>
              . O que fazer com {cardCount === 1 ? "ele" : "eles"}?
            </p>
            <div className="space-y-2">
              <label
                className={`flex gap-3 rounded-lg border p-3 text-sm ${
                  strategy === "move" ? "border-navy bg-blue-bg/40" : "border-border"
                } ${canMove ? "" : "opacity-50"}`}
              >
                <input
                  type="radio"
                  name="strategy"
                  className="mt-0.5 accent-navy"
                  checked={strategy === "move"}
                  disabled={!canMove}
                  onChange={() => setStrategy("move")}
                />
                <span className="flex-1">
                  <span className="block font-medium text-ink">Mover para outra lista</span>
                  <span className="mt-2 block">
                    <Select
                      value={targetId}
                      disabled={strategy !== "move" || !canMove}
                      onChange={(e) => setTargetId(e.target.value)}
                    >
                      {otherLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </Select>
                  </span>
                </span>
              </label>
              <label
                className={`flex gap-3 rounded-lg border p-3 text-sm ${
                  strategy === "delete" ? "border-red bg-red-bg/50" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  name="strategy"
                  className="mt-0.5 accent-red"
                  checked={strategy === "delete"}
                  onChange={() => setStrategy("delete")}
                />
                <span>
                  <span className="block font-medium text-ink">Excluir também os cards</span>
                  <span className="text-muted">Checklists e comentários dos cards serão perdidos.</span>
                </span>
              </label>
            </div>
          </>
        )}
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirm} disabled={busy || invalid}>
            Excluir lista
          </Button>
        </div>
      </div>
    </Modal>
  );
}
