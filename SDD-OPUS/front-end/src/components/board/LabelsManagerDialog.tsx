"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button, IconButton } from "@/components/ui/Button";
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
          className={`size-[26px] rounded-md ${LABEL_STYLES[color].swatch} ${value === color ? "ring-2 ring-ink ring-offset-2" : ""}`}
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
      <li className="flex h-[45px] items-center gap-3 rounded-lg border border-line bg-surface px-[17px]">
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-[3px] ${labelStyle(label.color).swatch}`} />
        <span className="min-w-0 flex-1 truncate text-[15.5px] text-ink">{label.name}</span>
        <IconButton label={`Editar etiqueta ${label.name}`} size={29} onClick={() => setEditing(true)}>
          <Pencil size={13} aria-hidden="true" />
        </IconButton>
        <IconButton label={`Excluir etiqueta ${label.name}`} size={29} onClick={onDelete}>
          <Trash2 size={13} aria-hidden="true" />
        </IconButton>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-navy bg-surface p-3">
      <form onSubmit={save} noValidate className="space-y-2.5">
        <input
          aria-label="Nome da etiqueta"
          value={name}
          maxLength={30}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          className="block h-10 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none focus:border-navy"
        />
        <ColorPicker value={color} onChange={setColor} name={label.name} />
        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error.fields.name ?? error.fields.color ?? error.message}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={update.isPending}>
            Salvar
          </Button>
          <Button
            variant="secondary"
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
      <Modal
        open={open}
        onClose={onClose}
        title="Etiquetas do quadro"
        width="max-w-[484px]"
        subtitle="Etiquetas coloridas organizam os cards e servem de filtro no quadro."
        footer={<Button onClick={onClose}>Concluído</Button>}
      >
        <div className="flex flex-col gap-5">
          {remove.isError && !toDelete && <Alert>{errorMessage(remove.error)}</Alert>}

          {labels.length === 0 ? (
            <p className="text-[15px] text-muted">Nenhuma etiqueta criada.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {labels.map((label) => (
                <LabelRow key={label.id} boardId={boardId} label={label} onDelete={() => setToDelete(label)} />
              ))}
            </ul>
          )}

          <form onSubmit={submit} noValidate className="flex flex-col gap-2.5 rounded-[10px] border border-line bg-surface-alt p-4">
            <p className="text-[13.5px] font-medium text-body">Nova etiqueta</p>
            <div className="flex items-center gap-2">
              <input
                aria-label="Nome da nova etiqueta"
                value={name}
                maxLength={30}
                placeholder="Nome (até 30 caracteres)"
                onChange={(event) => setName(event.target.value)}
                className="h-[42px] min-w-0 flex-1 rounded-lg border border-line bg-surface px-[17px] text-[15px] text-ink outline-none focus:border-navy"
              />
              <Button type="submit" loading={create.isPending} className="h-[42px]">
                Criar
              </Button>
            </div>
            <ColorPicker value={color} onChange={setColor} name="nova" />
            {error && (
              <p role="alert" className="text-[13px] text-danger">
                {error.fields.name ?? error.fields.color ?? error.message}
              </p>
            )}
          </form>
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
