"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import { LIMITS } from "@/lib/constants";
import { can } from "@/lib/permissions";
import { LABEL_COLOR_ORDER, LABEL_STYLES } from "@/lib/palette";
import type { Label, LabelColor } from "@/lib/types";
import { validateText } from "@/lib/validation";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog, ModalBody, ModalFooter, ModalHeader } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useBoardContext } from "./BoardContext";

interface LabelsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Quando presente, cada etiqueta ganha uma caixa para aplicar ao card (RF-31). */
  card?: { id: string; labelIds: string[]; onChange: (labelIds: string[]) => void };
}

/** Modal "Etiquetas do quadro" do protótipo (484px). */
export function LabelsDialog({ open, onClose, card }: LabelsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} label="Etiquetas do quadro" widthClass="w-[484px]">
      <LabelsContent onClose={onClose} card={card} />
    </Dialog>
  );
}

function LabelsContent({ onClose, card }: Pick<LabelsDialogProps, "onClose" | "card">) {
  const { boardId, data, reload, role } = useBoardContext();
  const toast = useToast();
  const canManage = can(role, "label.manage");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Label | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const usage = new Map<string, number>();
  for (const list of data.lists) {
    for (const item of list.cards) {
      for (const id of item.labelIds) usage.set(id, (usage.get(id) ?? 0) + 1);
    }
  }

  async function toggle(label: Label) {
    if (!card) return;
    const has = card.labelIds.includes(label.id);
    setPendingId(label.id);
    try {
      if (has) await api.delete(`/cards/${card.id}/labels/${label.id}`);
      else await api.put(`/cards/${card.id}/labels/${label.id}`);
      card.onChange(
        has ? card.labelIds.filter((id) => id !== label.id) : [...card.labelIds, label.id],
      );
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    } finally {
      setPendingId(null);
    }
  }

  async function remove(label: Label) {
    try {
      await api.delete(`/labels/${label.id}`);
      if (card?.labelIds.includes(label.id)) {
        card.onChange(card.labelIds.filter((id) => id !== label.id));
      }
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    }
    setDeleting(null);
    await reload();
  }

  return (
    <ModalBody>
      <ModalHeader
        title="Etiquetas do quadro"
        subtitle={
          card
            ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
            : "Crie, edite ou exclua as etiquetas deste quadro."
        }
        onClose={onClose}
      />

      {data.labels.length === 0 ? (
        <p className="text-[15px] text-muted">Este quadro ainda não tem etiquetas.</p>
      ) : (
        <ul className="space-y-2">
          {data.labels.map((label) => (
            <li key={label.id}>
              {editingId === label.id ? (
                <div className="rounded-lg border border-border bg-surface-alt p-3">
                  <LabelForm
                    initial={label}
                    submitLabel="Salvar"
                    onSubmit={async (value) => {
                      await api.patch(`/labels/${label.id}`, value);
                      await reload();
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex h-[45px] items-center gap-3 rounded-lg border border-border bg-surface px-[17px]">
                  {card ? (
                    <Checkbox
                      checked={card.labelIds.includes(label.id)}
                      disabled={!canManage || pendingId === label.id}
                      onChange={() => toggle(label)}
                      label={`Aplicar ${label.name} ao card`}
                    />
                  ) : null}
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${LABEL_STYLES[label.color].swatch}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[15.5px] text-ink">{label.name}</span>
                  <span
                    className="font-mono text-xs text-placeholder"
                    aria-label={`Usada em ${usage.get(label.id) ?? 0} cards`}
                  >
                    {usage.get(label.id) ?? 0}
                  </span>
                  {canManage ? (
                    <span className="flex gap-1.5">
                      <IconButton
                        icon={Pencil}
                        label={`Editar etiqueta ${label.name}`}
                        size={28}
                        onClick={() => setEditingId(label.id)}
                      />
                      <IconButton
                        icon={Trash2}
                        label={`Excluir etiqueta ${label.name}`}
                        size={28}
                        onClick={() => setDeleting(label)}
                      />
                    </span>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage ? (
        <div className="space-y-2.5 rounded-[10px] border border-border bg-surface-alt p-4">
          <p className="text-[13.5px] font-medium text-body">Nova etiqueta</p>
          <LabelForm
            submitLabel="Criar"
            clearOnSubmit
            onSubmit={async (value) => {
              await api.post(`/boards/${boardId}/labels`, value);
              await reload();
            }}
          />
        </div>
      ) : null}

      <ModalFooter>
        <Button onClick={onClose}>Concluído</Button>
      </ModalFooter>

      <ConfirmDialog
        open={deleting !== null}
        title={`Excluir a etiqueta “${deleting?.name ?? ""}”?`}
        confirmLabel="Excluir etiqueta"
        onConfirm={() => (deleting ? remove(deleting) : undefined)}
        onClose={() => setDeleting(null)}
      >
        <p>Ela será removida de todos os cards que a usam. Os cards permanecem.</p>
      </ConfirmDialog>
    </ModalBody>
  );
}

function LabelForm({
  initial,
  submitLabel,
  clearOnSubmit = false,
  onSubmit,
  onCancel,
}: {
  initial?: Label;
  submitLabel: string;
  clearOnSubmit?: boolean;
  onSubmit: (value: { name: string; color: LabelColor }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState<LabelColor>(initial?.color ?? "red");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateText(name, "Nome da etiqueta", LIMITS.labelName.min, LIMITS.labelName.max);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSubmit({ name, color });
      if (clearOnSubmit) setName("");
    } catch (cause) {
      const apiError = toApiError(cause);
      setError(apiError.fieldMessage("name") ?? apiError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Field
            id={`label-name-${initial?.id ?? "new"}`}
            aria-label="Nome da etiqueta"
            placeholder="Nome"
            value={name}
            disabled={pending}
            error={error}
            onChange={(event) => setName(event.target.value)}
            className="h-[42px]"
          />
        </div>
        <Button type="submit" loading={pending} className="h-[42px]">
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button variant="ghost" disabled={pending} onClick={onCancel} className="h-[42px]">
            Cancelar
          </Button>
        ) : null}
      </div>
      <div role="radiogroup" aria-label="Cor da etiqueta" className="flex gap-1.5 pt-1">
        {LABEL_COLOR_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={color === option}
            aria-label={LABEL_STYLES[option].name}
            title={LABEL_STYLES[option].name}
            onClick={() => setColor(option)}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg border-2 ${
              color === option ? "border-ink" : "border-transparent"
            }`}
          >
            <span className={`h-[22px] w-[22px] rounded-md ${LABEL_STYLES[option].swatch}`} />
          </button>
        ))}
      </div>
    </form>
  );
}
