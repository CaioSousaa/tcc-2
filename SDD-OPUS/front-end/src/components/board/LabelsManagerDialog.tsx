"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { errorMessage, parseApiError } from "@/lib/api";
import { useCreateLabel, useDeleteLabel, useUpdateLabel } from "@/lib/card";
import { LABEL_COLOR_KEYS, LABEL_STYLES, labelStyle } from "@/lib/palette";
import type { Label } from "@/lib/types";

function ColorPicker({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (color: string) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={`Cor da etiqueta ${name}`} className="flex flex-wrap gap-1.5">
      {LABEL_COLOR_KEYS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={value === color}
          aria-label={LABEL_STYLES[color].name}
          title={LABEL_STYLES[color].name}
          onClick={() => onChange(color)}
          className={`size-6 rounded-full ${LABEL_STYLES[color].swatch} ${value === color ? "ring-2 ring-slate-900 ring-offset-2" : ""}`}
        />
      ))}
    </div>
  );
}

function LabelRow({ boardId, label, onDelete }: { boardId: string; label: Label; onDelete: () => void }) {
  const update = useUpdateLabel(boardId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);

  const error = update.isError ? parseApiError(update.error) : null;

  function save(event: FormEvent) {
    event.preventDefault();
    update.mutate({ labelId: label.id, name, color }, { onSuccess: () => setEditing(false) });
  }

  if (!editing) {
    return (
      <li className="flex items-center gap-2 py-2">
        <span className={`rounded px-2 py-0.5 text-sm font-medium ${labelStyle(label.color).chip}`}>{label.name}</span>
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Excluir
        </Button>
      </li>
    );
  }

  return (
    <li className="py-2">
      <form onSubmit={save} noValidate className="space-y-2">
        <input
          aria-label="Nome da etiqueta"
          value={name}
          maxLength={30}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          className="block w-full rounded-md border-0 bg-white px-2 py-1 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
        />
        <ColorPicker value={color} onChange={setColor} name={label.name} />
        {error && (
          <p role="alert" className="text-xs text-red-600">
            {error.fields.name ?? error.fields.color ?? error.message}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={update.isPending}>
            Salvar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false);
              setName(label.name);
              setColor(label.color);
              update.reset();
            }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </li>
  );
}

interface LabelsManagerDialogProps {
  boardId: string;
  labels: Label[];
  open: boolean;
  onClose: () => void;
}

/** Create, rename, recolor and delete the board's labels (E1, E2). */
export function LabelsManagerDialog({ boardId, labels, open, onClose }: LabelsManagerDialogProps) {
  const create = useCreateLabel(boardId);
  const remove = useDeleteLabel(boardId);

  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("blue");
  const [toDelete, setToDelete] = useState<Label | null>(null);

  const error = create.isError ? parseApiError(create.error) : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate({ name, color }, { onSuccess: () => setName("") });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} title="Etiquetas do quadro">
        <div className="space-y-5">
          <form onSubmit={submit} noValidate className="space-y-2 rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">Nova etiqueta</p>
            <input
              aria-label="Nome da nova etiqueta"
              value={name}
              maxLength={30}
              placeholder="Nome (até 30 caracteres)"
              onChange={(event) => setName(event.target.value)}
              className="block w-full rounded-md border-0 bg-white px-2 py-1.5 text-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-indigo-600"
            />
            <ColorPicker value={color} onChange={setColor} name="nova" />
            {error && (
              <p role="alert" className="text-xs text-red-600">
                {error.fields.name ?? error.fields.color ?? error.message}
              </p>
            )}
            <Button type="submit" size="sm" loading={create.isPending}>
              Criar etiqueta
            </Button>
          </form>

          {remove.isError && !toDelete && <Alert>{errorMessage(remove.error)}</Alert>}

          {labels.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma etiqueta criada.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {labels.map((label) => (
                <LabelRow key={label.id} boardId={boardId} label={label} onDelete={() => setToDelete(label)} />
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir etiqueta"
        confirmLabel="Excluir etiqueta"
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        onCancel={() => {
          setToDelete(null);
          remove.reset();
        }}
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
        }}
      >
        <p>
          A etiqueta <strong>{toDelete?.name}</strong> será removida de todos os cards que a usam. Os
          cards não serão excluídos.
        </p>
      </ConfirmDialog>
    </>
  );
}
