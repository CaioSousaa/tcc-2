"use client";

import { useState, type FormEvent } from "react";
import { toApiError } from "@/lib/api";
import { LIMITS } from "@/lib/constants";
import { BOARD_COLOR_ORDER, BOARD_STYLES } from "@/lib/palette";
import type { BoardColor } from "@/lib/types";
import { validateText } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";

export interface BoardFormValue {
  name: string;
  color: BoardColor;
  withDefaultLists: boolean;
}

interface BoardFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: { name: string; color: BoardColor };
  onSubmit: (value: BoardFormValue) => Promise<void>;
  onClose: () => void;
}

/** Modais "Novo quadro" / "Editar quadro" do protótipo: nome, cor e listas padrão. */
export function BoardFormDialog(props: BoardFormDialogProps) {
  const title = props.mode === "create" ? "Novo quadro" : "Editar quadro";
  return (
    <Dialog open={props.open} onClose={props.onClose} label={title}>
      <BoardForm {...props} title={title} />
    </Dialog>
  );
}

function BoardForm({
  mode,
  title,
  initial,
  onSubmit,
  onClose,
}: BoardFormDialogProps & { title: string }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<BoardColor>(initial?.color ?? "navy");
  const [withDefaultLists, setWithDefaultLists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateText(name, "Nome do quadro", LIMITS.boardName.min, LIMITS.boardName.max);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), color, withDefaultLists });
      onClose();
    } catch (cause) {
      const apiError = toApiError(cause);
      setError(apiError.fieldMessage("name") ?? apiError.message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <ModalBody>
        <ModalHeader title={title} onClose={onClose} />
        <Field
          id="board-name"
          label="Nome do quadro"
          autoFocus
          placeholder="Ex.: Sprint 13"
          value={name}
          error={error}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-body" id="board-color-label">
            Cor
          </p>
          <div role="radiogroup" aria-labelledby="board-color-label" className="flex gap-2">
            {BOARD_COLOR_ORDER.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={color === option}
                aria-label={BOARD_STYLES[option].name}
                title={BOARD_STYLES[option].name}
                onClick={() => setColor(option)}
                className={`flex h-9 w-9 items-center justify-center rounded-[10px] border-2 ${
                  color === option ? "border-ink" : "border-transparent"
                }`}
              >
                <span className={`h-[30px] w-[30px] rounded-[7px] ${BOARD_STYLES[option].band}`} />
              </button>
            ))}
          </div>
        </div>
        {mode === "create" ? (
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={withDefaultLists}
              onChange={setWithDefaultLists}
              label="Criar com listas padrão"
            />
            <span className="text-[15.5px] leading-snug text-body">
              Criar com listas padrão (A fazer, Em progresso, Concluído)
            </span>
          </label>
        ) : null}
        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            {mode === "create" ? "Criar quadro" : "Salvar"}
          </Button>
        </ModalFooter>
      </ModalBody>
    </form>
  );
}
