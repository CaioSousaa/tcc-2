"use client";

import { Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { CheckboxBox, Field, FormError } from "@/components/ui/Field";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { LABEL_COLORS } from "@/lib/colors";
import type { Label } from "@/lib/types";

export function LabelsModal({
  boardId,
  labels,
  usage,
  isAdmin,
  selectedIds,
  onToggle,
  onClose,
  onChanged,
}: {
  boardId: string;
  labels: Label[];
  usage: Record<string, number>;
  isAdmin: boolean;
  selectedIds?: string[];
  onToggle?: (labelId: string) => void;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(LABEL_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <Modal
      title="Etiquetas do quadro"
      subtitle={
        onToggle
          ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
          : "Crie e edite as etiquetas disponíveis neste quadro."
      }
      width={484}
      onClose={onClose}
    >
      <ul className="flex flex-col gap-2">
        {labels.map((l) =>
          editingId === l.id ? (
            <li
              key={l.id}
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-surface p-3.5"
            >
              <Field
                value={editName}
                maxLength={40}
                aria-label="Nome da etiqueta"
                onChange={(e) => setEditName(e.target.value)}
              />
              <ColorPicker colors={LABEL_COLORS} value={editColor} onChange={setEditColor} size="sm" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                  <X size={14} /> Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!editName.trim()}
                  onClick={() =>
                    run(async () => {
                      await api.patch(`/labels/${l.id}`, { name: editName, color: editColor });
                      setEditingId(null);
                    })
                  }
                >
                  Salvar
                </Button>
              </div>
            </li>
          ) : (
            <li
              key={l.id}
              className="group flex h-[45px] items-center gap-3 rounded-lg border border-border bg-surface px-[17px]"
            >
              {onToggle && (
                <CheckboxBox
                  aria-label={`Aplicar etiqueta ${l.name}`}
                  checked={selectedIds?.includes(l.id) ?? false}
                  onChange={() => onToggle(l.id)}
                />
              )}
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: l.color }} />
              <span className="min-w-0 flex-1 truncate text-[15.5px] text-ink">{l.name}</span>
              {isAdmin && (
                <span className="flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Editar etiqueta"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-black/5 hover:text-ink"
                    onClick={() => {
                      setEditingId(l.id);
                      setEditName(l.name);
                      setEditColor(l.color);
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir etiqueta"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-black/5 hover:text-red"
                    onClick={() => run(() => api.delete(`/labels/${l.id}`))}
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              )}
              <span className="font-mono text-xs text-placeholder">{usage[l.id] ?? 0}</span>
            </li>
          ),
        )}
        {labels.length === 0 && (
          <li className="text-sm text-muted">Este quadro ainda não tem etiquetas.</li>
        )}
      </ul>

      {isAdmin ? (
        <form
          className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-surface-alt p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              await api.post(`/boards/${boardId}/labels`, { name, color });
              setName("");
            });
          }}
        >
          <span className="text-[13.5px] font-medium text-body">Nova etiqueta</span>
          <div className="flex items-center gap-2">
            <Field
              wrapperClassName="min-w-0 flex-1"
              className="h-[42px] text-[15px]"
              placeholder="Nome"
              aria-label="Nome da nova etiqueta"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" className="h-[42px] shrink-0" disabled={!name.trim()}>
              Criar
            </Button>
          </div>
          <ColorPicker colors={LABEL_COLORS} value={color} onChange={setColor} size="sm" />
        </form>
      ) : (
        <p className="text-[13.5px] text-muted">Apenas administradores gerenciam etiquetas.</p>
      )}
      <FormError message={error} />
      <ModalFooter>
        <Button onClick={onClose}>Concluído</Button>
      </ModalFooter>
    </Modal>
  );
}
