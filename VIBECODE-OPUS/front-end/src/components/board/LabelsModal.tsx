"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { api, getErrorMessage } from "@/lib/api";
import { LABEL_COLORS, SOLID } from "@/lib/colors";
import type { Label, LabelColor } from "@/lib/types";

interface LabelsModalProps {
  open: boolean;
  boardId: string;
  labels: Label[];
  /** How many cards use each label. */
  usage: Map<string, number>;
  isAdmin: boolean;
  /** When set, the checkboxes toggle the labels of this card. */
  cardLabelIds?: string[] | null;
  onToggleCardLabel?: (labelId: string, attach: boolean) => Promise<void>;
  onClose: () => void;
  onChanged: () => void;
}

function LabelRow({
  label,
  count,
  isAdmin,
  checked,
  onToggle,
  onChanged,
}: {
  label: Label;
  count: number;
  isAdmin: boolean;
  checked: boolean | null;
  onToggle: (attach: boolean) => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState<LabelColor>(label.color);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.patch(`/labels/${label.id}`, { name: name.trim(), color });
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api.delete(`/labels/${label.id}`);
      toast.success("Etiqueta excluída");
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="flex flex-col gap-3 rounded-[10px] border border-navy/40 bg-surface p-3.5">
        <Input
          className="h-10"
          value={name}
          autoFocus
          maxLength={50}
          placeholder="Nome da etiqueta"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && save()}
        />
        <div className="flex items-center justify-between gap-3">
          <ColorPicker colors={LABEL_COLORS} value={color} onChange={setColor} size={26} />
          <div className="flex gap-2">
            <IconButton label="Cancelar edição" onClick={() => setEditing(false)}>
              <X size={14} />
            </IconButton>
            <IconButton label="Salvar etiqueta" onClick={save} disabled={busy}>
              <Check size={14} />
            </IconButton>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex min-h-[46px] items-center gap-3 rounded-[10px] border border-border bg-surface px-4">
      {checked !== null && (
        <Checkbox
          checked={checked}
          onChange={onToggle}
          ariaLabel={`Aplicar etiqueta ${label.name || "sem nome"}`}
        />
      )}
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: SOLID[label.color] }} />
      <span className="flex-1 truncate text-[16px] text-ink">{label.name || "Sem nome"}</span>
      {confirmDelete ? (
        <span className="flex items-center gap-2 text-[13px] text-red">
          Excluir?
          <Button size="sm" variant="danger" className="h-7 px-2.5" loading={busy} onClick={remove}>
            Sim
          </Button>
          <Button size="sm" variant="secondary" className="h-7 px-2.5" onClick={() => setConfirmDelete(false)}>
            Não
          </Button>
        </span>
      ) : (
        <>
          <span className="font-mono text-[12px] text-placeholder" title={`${count} card(s)`}>
            {count}
          </span>
          {isAdmin && (
            <span className="flex gap-1.5">
              <IconButton label="Editar etiqueta" size={28} onClick={() => setEditing(true)}>
                <Pencil size={12} />
              </IconButton>
              <IconButton label="Excluir etiqueta" size={28} onClick={() => setConfirmDelete(true)}>
                <Trash2 size={12} />
              </IconButton>
            </span>
          )}
        </>
      )}
    </li>
  );
}

export function LabelsModal({
  open,
  boardId,
  labels,
  usage,
  isAdmin,
  cardLabelIds,
  onToggleCardLabel,
  onClose,
  onChanged,
}: LabelsModalProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColor>("red");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setColor("red");
    }
  }, [open]);

  const forCard = Array.isArray(cardLabelIds);

  async function create() {
    if (!name.trim()) {
      toast.error("Informe o nome da etiqueta");
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post<{ label: Label }>(`/boards/${boardId}/labels`, {
        name: name.trim(),
        color,
      });
      setName("");
      if (forCard && onToggleCardLabel) await onToggleCardLabel(data.label.id, true);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  const description = forCard
    ? isAdmin
      ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
      : "Marque as etiquetas aplicadas a este card."
    : isAdmin
      ? "Crie, edite ou remova as etiquetas usadas para classificar e filtrar os cards."
      : "Etiquetas disponíveis neste quadro. Apenas administradores podem alterá-las.";

  return (
    <Modal open={open} onClose={onClose} title="Etiquetas do quadro" description={description} width={484}>
      <ul className="flex max-h-[360px] flex-col gap-2 overflow-y-auto">
        {labels.length === 0 && (
          <li className="rounded-[10px] border border-dashed border-border px-4 py-5 text-center text-[14px] text-muted">
            Nenhuma etiqueta criada ainda.
          </li>
        )}
        {labels.map((label) => (
          <LabelRow
            key={`${label.id}-${label.name}-${label.color}`}
            label={label}
            count={usage.get(label.id) ?? 0}
            isAdmin={isAdmin}
            checked={forCard ? cardLabelIds!.includes(label.id) : null}
            onToggle={(attach) => onToggleCardLabel?.(label.id, attach)}
            onChanged={onChanged}
          />
        ))}
      </ul>

      {isAdmin && (
        <div className="mt-5 rounded-xl border border-border bg-surface-alt p-4">
          <p className="text-[14px] text-body">Nova etiqueta</p>
          <div className="mt-2.5 flex gap-2">
            <Input
              className="h-[42px]"
              placeholder="Nome"
              value={name}
              maxLength={50}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && create()}
            />
            <Button className="h-[42px]" loading={creating} onClick={create}>
              Criar
            </Button>
          </div>
          <div className="mt-3">
            <ColorPicker colors={LABEL_COLORS} value={color} onChange={setColor} size={28} />
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Concluído</Button>
      </div>
    </Modal>
  );
}
