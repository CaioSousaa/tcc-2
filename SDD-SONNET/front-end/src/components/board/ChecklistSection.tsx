"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { api, toApiError } from "@/lib/api";
import {
  addChecklistLocal,
  addItemLocal,
  countProgress,
  removeChecklistLocal,
  removeItemLocal,
  renameChecklistLocal,
  updateItemLocal,
} from "@/lib/checklists";
import { LIMITS } from "@/lib/constants";
import { progressPercent } from "@/lib/progress";
import type { Checklist, ChecklistItem, CardDetail } from "@/lib/types";
import { validateText } from "@/lib/validation";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";

interface ChecklistSectionProps {
  detail: CardDetail;
  canEdit: boolean;
  onChange: (next: CardDetail) => void;
}

const DASHED =
  "flex h-9 items-center justify-center self-start rounded-md border border-dashed border-outline-soft px-[13px] text-sm text-muted hover:bg-black/[0.03]";

export function ChecklistSection({ detail, canEdit, onChange }: ChecklistSectionProps) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const total = countProgress(detail.checklists);
  const percent = progressPercent(total);

  /** Aplica a mudança e recalcula o progresso do card na hora (RF-24). */
  function apply(checklists: Checklist[]) {
    onChange({ ...detail, checklists, progress: countProgress(checklists) });
  }

  function fail(cause: unknown) {
    toast(toApiError(cause).message, "error");
  }

  return (
    <section aria-labelledby="checklists-title" className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 id="checklists-title" className="text-[13.5px] font-medium text-body">
          {detail.checklists.length === 1 ? "Checklist" : "Checklists"}
        </h4>
        {detail.checklists.length > 1 && percent !== null ? (
          <span className="font-mono text-[12.5px] text-muted">
            Card: {total.done}/{total.total} · {percent}%
          </span>
        ) : null}
      </div>

      {detail.checklists.length === 0 ? <p className="text-[15px] text-placeholder">Sem checklists.</p> : null}

      {detail.checklists.map((checklist) => (
        <ChecklistBlock
          key={checklist.id}
          checklist={checklist}
          showTitle={detail.checklists.length > 1}
          canEdit={canEdit}
          onRename={async (name) => {
            await api.patch(`/checklists/${checklist.id}`, { title: name });
            apply(renameChecklistLocal(detail.checklists, checklist.id, name.trim()));
          }}
          onDelete={async () => {
            try {
              await api.delete(`/checklists/${checklist.id}`);
              apply(removeChecklistLocal(detail.checklists, checklist.id));
            } catch (cause) {
              fail(cause);
            }
          }}
          onAddItem={async (text) => {
            const response = await api.post<{ item: ChecklistItem }>(
              `/checklists/${checklist.id}/items`,
              { text },
            );
            apply(addItemLocal(detail.checklists, checklist.id, response.data.item));
          }}
          onToggle={async (item) => {
            try {
              await api.patch(`/checklist-items/${item.id}`, { done: !item.done });
              apply(updateItemLocal(detail.checklists, item.id, { done: !item.done }));
            } catch (cause) {
              fail(cause);
            }
          }}
          onEditItem={async (item, text) => {
            await api.patch(`/checklist-items/${item.id}`, { text });
            apply(updateItemLocal(detail.checklists, item.id, { text: text.trim() }));
          }}
          onDeleteItem={async (item) => {
            try {
              await api.delete(`/checklist-items/${item.id}`);
              apply(removeItemLocal(detail.checklists, item.id));
            } catch (cause) {
              fail(cause);
            }
          }}
        />
      ))}

      {canEdit ? (
        creating ? (
          <InlineText
            label="Título do checklist"
            initial=""
            min={LIMITS.checklistTitle.min}
            max={LIMITS.checklistTitle.max}
            fieldLabel="Título do checklist"
            submitLabel="Adicionar checklist"
            onSave={async (title) => {
              const response = await api.post<{ checklist: Checklist }>(
                `/cards/${detail.id}/checklists`,
                { title },
              );
              apply(addChecklistLocal(detail.checklists, response.data.checklist));
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <button type="button" className={DASHED} onClick={() => setCreating(true)}>
            + Adicionar checklist
          </button>
        )
      ) : null}
    </section>
  );
}

interface ChecklistBlockProps {
  checklist: Checklist;
  showTitle: boolean;
  canEdit: boolean;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddItem: (text: string) => Promise<void>;
  onToggle: (item: ChecklistItem) => Promise<void>;
  onEditItem: (item: ChecklistItem, text: string) => Promise<void>;
  onDeleteItem: (item: ChecklistItem) => Promise<void>;
}

function ChecklistBlock({
  checklist,
  showTitle,
  canEdit,
  onRename,
  onDelete,
  onAddItem,
  onToggle,
  onEditItem,
  onDeleteItem,
}: ChecklistBlockProps) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const done = checklist.items.filter((item) => item.done).length;

  return (
    <div className="space-y-3.5 rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between gap-2">
        {renaming ? (
          <InlineText
            label="Título do checklist"
            initial={checklist.title}
            min={LIMITS.checklistTitle.min}
            max={LIMITS.checklistTitle.max}
            fieldLabel="Título do checklist"
            onSave={async (value) => {
              await onRename(value);
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <h5 className="min-w-0 flex-1 break-words text-[15px] font-medium text-ink">
              {showTitle || checklist.title ? checklist.title : "Checklist"}
            </h5>
            <span className="shrink-0 font-mono text-[12.5px] text-muted">
              {done}/{checklist.items.length} concluídos
            </span>
            {canEdit ? (
              <span className="flex shrink-0 gap-1.5">
                <IconButton
                  icon={Pencil}
                  size={26}
                  label={`Renomear checklist ${checklist.title}`}
                  onClick={() => setRenaming(true)}
                />
                <IconButton
                  icon={Trash2}
                  size={26}
                  label={`Excluir checklist ${checklist.title}`}
                  onClick={() => setDeleting(true)}
                />
              </span>
            ) : null}
          </>
        )}
      </div>

      <ProgressBar progress={{ done, total: checklist.items.length }} thick label="" />

      <ul className="space-y-4 pl-[11px] pt-1.5">
        {checklist.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            canEdit={canEdit}
            onToggle={() => onToggle(item)}
            onEdit={(text) => onEditItem(item, text)}
            onDelete={() => onDeleteItem(item)}
          />
        ))}
      </ul>

      {canEdit ? (
        addingItem ? (
          <InlineText
            label="Novo item"
            initial=""
            min={LIMITS.checklistItem.min}
            max={LIMITS.checklistItem.max}
            fieldLabel="Texto do item"
            submitLabel="Adicionar"
            keepOpen
            onSave={onAddItem}
            onCancel={() => setAddingItem(false)}
          />
        ) : (
          <button type="button" className={DASHED} onClick={() => setAddingItem(true)}>
            + Adicionar item
          </button>
        )
      ) : null}

      <ConfirmDialog
        open={deleting}
        title={`Excluir o checklist “${checklist.title}”?`}
        confirmLabel="Excluir checklist"
        onConfirm={async () => {
          await onDelete();
          setDeleting(false);
        }}
        onClose={() => setDeleting(false)}
      >
        <p>Os itens do checklist serão removidos e o progresso do card será recalculado.</p>
      </ConfirmDialog>
    </div>
  );
}

function ItemRow({
  item,
  canEdit,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem;
  canEdit: boolean;
  onToggle: () => Promise<void>;
  onEdit: (text: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="flex items-center gap-3">
      <Checkbox
        checked={item.done}
        disabled={!canEdit}
        onChange={() => void onToggle()}
        label={`Marcar “${item.text}” como feito`}
      />
      {editing ? (
        <InlineText
          label="Texto do item"
          initial={item.text}
          min={LIMITS.checklistItem.min}
          max={LIMITS.checklistItem.max}
          fieldLabel="Texto do item"
          onSave={async (value) => {
            await onEdit(value);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <span
            className={`min-w-0 flex-1 break-words text-[15.5px] ${
              item.done ? "text-placeholder" : "text-ink"
            }`}
          >
            {item.text}
          </span>
          {canEdit ? (
            <span className="flex shrink-0 gap-1.5">
              <IconButton
                icon={Pencil}
                size={26}
                label={`Editar item “${item.text}”`}
                onClick={() => setEditing(true)}
              />
              <IconButton
                icon={Trash2}
                size={26}
                danger
                label={`Excluir item “${item.text}”`}
                onClick={() => void onDelete()}
              />
            </span>
          ) : null}
        </>
      )}
    </li>
  );
}

/** Campo de uma linha com validação, envio único e erro junto ao campo (RT-20). */
function InlineText({
  label,
  initial,
  min,
  max,
  fieldLabel,
  submitLabel = "Salvar",
  keepOpen = false,
  onSave,
  onCancel,
}: {
  label: string;
  initial: string;
  min: number;
  max: number;
  fieldLabel: string;
  submitLabel?: string;
  keepOpen?: boolean;
  onSave: (value: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateText(value, fieldLabel, min, max);
    if (invalid) {
      setError(invalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      await onSave(value.trim());
      if (keepOpen) setValue("");
    } catch (cause) {
      setError(toApiError(cause).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="min-w-0 flex-1 space-y-1">
      <div className="flex gap-2">
        <input
          autoFocus
          aria-label={label}
          value={value}
          disabled={pending}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") onCancel();
          }}
          className="block h-9 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-[15px] text-ink focus:outline-2 focus:outline-navy"
        />
        <Button type="submit" small loading={pending}>
          {submitLabel}
        </Button>
        <Button variant="ghost" small disabled={pending} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-red">
          {error}
        </p>
      ) : null}
    </form>
  );
}
