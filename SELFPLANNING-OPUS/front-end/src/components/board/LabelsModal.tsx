"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { FormError, inputClass } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { LABEL_COLORS } from "@/lib/format";
import type { Label } from "@/lib/types";

interface LabelsModalProps {
  boardId: string;
  labels: Label[];
  canEdit: boolean;
  /** Modo card: mostra checkboxes para aplicar/remover etiquetas do card */
  selectedIds?: string[];
  onToggle?: (labelId: string, selected: boolean) => Promise<void>;
  onChanged: () => void;
  onClose: () => void;
}

export function LabelsModal({
  boardId,
  labels,
  canEdit,
  selectedIds,
  onToggle,
  onChanged,
  onClose,
}: LabelsModalProps) {
  const cardMode = selectedIds !== undefined && onToggle !== undefined;
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const [editing, setEditing] = useState<{ id: string; name: string; color: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    run(async () => {
      await api.post(`/boards/${boardId}/labels`, { name, color });
      setName("");
    });
  };

  const saveEdit = () =>
    editing &&
    run(async () => {
      await api.patch(`/boards/${boardId}/labels/${editing.id}`, {
        name: editing.name,
        color: editing.color,
      });
      setEditing(null);
    });

  const remove = (label: Label) => {
    if (!window.confirm(`Excluir a etiqueta “${label.name}”? Ela será removida de todos os cards.`)) return;
    run(() => api.delete(`/boards/${boardId}/labels/${label.id}`));
  };

  return (
    <Modal
      title="Etiquetas do quadro"
      subtitle={
        cardMode
          ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
          : "Crie etiquetas coloridas para organizar e filtrar os cards."
      }
      width={484}
      onClose={onClose}
    >
      <ul className="flex max-h-[330px] flex-col gap-2 overflow-y-auto">
        {labels.length === 0 && <li className="text-[15px] text-muted">Nenhuma etiqueta criada ainda.</li>}
        {labels.map((label) =>
          editing?.id === label.id ? (
            <li key={label.id} className="flex flex-col gap-2.5 rounded-lg border border-navy p-3">
              <input
                autoFocus
                maxLength={40}
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                className={`${inputClass} h-10`}
              />
              <div className="flex items-center justify-between gap-2">
                <ColorPicker
                  colors={LABEL_COLORS}
                  size={30}
                  value={editing.color}
                  onChange={(value) => setEditing({ ...editing, color: value })}
                />
                <div className="flex gap-2">
                  <Button compact variant="secondary" onClick={() => setEditing(null)}>
                    Cancelar
                  </Button>
                  <Button compact loading={busy} onClick={saveEdit}>
                    Salvar
                  </Button>
                </div>
              </div>
            </li>
          ) : (
            <li
              key={label.id}
              className="flex h-[45px] shrink-0 items-center gap-3 rounded-lg border border-border bg-white px-[17px]"
            >
              {cardMode && (
                <Checkbox
                  label={label.name}
                  disabled={!canEdit || busy}
                  checked={selectedIds.includes(label.id)}
                  onChange={(checked) => run(() => onToggle(label.id, checked))}
                />
              )}
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: label.color }} />
              <span className="flex-1 truncate text-[15.5px] text-ink">{label.name}</span>
              {label.usage !== undefined && <span className="text-xs text-placeholder">{label.usage}</span>}
              {canEdit && (
                <div className="flex gap-1.5">
                  <IconButton label="Editar etiqueta" size={28} onClick={() => setEditing({ ...label })}>
                    <Pencil size={12} />
                  </IconButton>
                  <IconButton label="Excluir etiqueta" size={28} onClick={() => remove(label)}>
                    <Trash2 size={12} />
                  </IconButton>
                </div>
              )}
            </li>
          ),
        )}
      </ul>

      {canEdit && (
        <form
          onSubmit={create}
          className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-surface-alt p-4"
        >
          <span className="text-[13.5px] font-medium text-body">Nova etiqueta</span>
          <div className="flex gap-2">
            <input
              maxLength={40}
              value={name}
              placeholder="Nome da etiqueta"
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} h-[42px]`}
            />
            <Button type="submit" className="h-[42px]" disabled={busy || !name.trim()}>
              Criar
            </Button>
          </div>
          <div className="pt-1">
            <ColorPicker colors={LABEL_COLORS} size={30} value={color} onChange={setColor} />
          </div>
        </form>
      )}

      <FormError message={error} />
      <div className="flex justify-end pt-1.5">
        <Button onClick={onClose}>Concluído</Button>
      </div>
    </Modal>
  );
}
