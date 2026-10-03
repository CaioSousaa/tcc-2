"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, FormError } from "@/components/ui/Field";
import { LabelChip } from "@/components/ui/LabelChip";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import type { Label } from "@/lib/types";

const PALETTE = ["#2F6FB5", "#2A8F6A", "#C98A1A", "#C8423A", "#7B5CBD", "#6B7A8C", "#1D3557", "#D9689A"];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          style={{ backgroundColor: c }}
          className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${
            value.toUpperCase() === c ? "ring-2 ring-ink ring-offset-1" : ""
          }`}
        >
          {value.toUpperCase() === c && <Check size={12} />}
        </button>
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
        aria-label="Cor personalizada"
      />
    </div>
  );
}

export function LabelsModal({
  boardId,
  labels,
  isAdmin,
  onClose,
  onChanged,
}: {
  boardId: string;
  labels: Label[];
  isAdmin: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(PALETTE[0]);
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
    <Modal title="Etiquetas" onClose={onClose}>
      <div className="space-y-4 p-5">
        <ul className="space-y-2">
          {labels.map((l) =>
            editingId === l.id ? (
              <li key={l.id} className="space-y-2 rounded-lg border border-border p-3">
                <Field value={editName} maxLength={40} onChange={(e) => setEditName(e.target.value)} />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="h-8" onClick={() => setEditingId(null)}>
                    <X size={14} /> Cancelar
                  </Button>
                  <Button
                    className="h-8"
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
              <li key={l.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <LabelChip name={l.name} color={l.color} />
                </div>
                {isAdmin && (
                  <>
                    <IconButton
                      aria-label="Editar etiqueta"
                      onClick={() => {
                        setEditingId(l.id);
                        setEditName(l.name);
                        setEditColor(l.color);
                      }}
                    >
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton
                      aria-label="Excluir etiqueta"
                      onClick={() => run(() => api.delete(`/labels/${l.id}`))}
                    >
                      <Trash2 size={14} />
                    </IconButton>
                  </>
                )}
              </li>
            ),
          )}
          {labels.length === 0 && (
            <li className="text-sm text-muted">Este quadro ainda não tem etiquetas.</li>
          )}
        </ul>

        {isAdmin ? (
          <form
            className="space-y-3 border-t border-border pt-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api.post(`/boards/${boardId}/labels`, { name, color });
                setName("");
              });
            }}
          >
            <Field
              label="Nova etiqueta"
              placeholder="Ex.: Urgente"
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <ColorPicker value={color} onChange={setColor} />
            <div className="flex items-center justify-between gap-2">
              {name.trim() ? <LabelChip name={name.trim()} color={color} /> : <span />}
              <Button type="submit" disabled={!name.trim()}>
                Criar etiqueta
              </Button>
            </div>
          </form>
        ) : (
          <p className="border-t border-border pt-3 text-xs text-muted">
            Apenas administradores gerenciam etiquetas.
          </p>
        )}
        <FormError message={error} />
      </div>
    </Modal>
  );
}
