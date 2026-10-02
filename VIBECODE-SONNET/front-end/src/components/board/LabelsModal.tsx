"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash, X } from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { LABEL_COLORS } from "@/lib/colors";
import type { Label } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ColorSwatches } from "@/components/ui/ColorSwatches";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

const SWATCHES = LABEL_COLORS.map((c) => c.color);

interface LabelsModalProps {
  open: boolean;
  boardId: string;
  labels: Label[];
  isAdmin: boolean;
  /** Quando informado, o modal aplica/remove etiquetas deste card. */
  card?: { id: string; labelIds: string[] } | null;
  onClose: () => void;
  /** Disparado após qualquer alteração (para recarregar quadro/card). */
  onChanged: () => void;
}

export function LabelsModal({ open, boardId, labels, isAdmin, card, onClose, onChanged }: LabelsModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(SWATCHES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(SWATCHES[0]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setApplied(new Set(card?.labelIds ?? []));
    setEditingId(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, card?.id]);

  async function run(key: string, action: () => Promise<unknown>): Promise<boolean> {
    setBusy(key);
    setError(null);
    try {
      await action();
      onChanged();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy(null);
    }
  }

  function toggle(label: Label) {
    if (!card) return;
    const isApplied = applied.has(label.id);
    const next = new Set(applied);
    if (isApplied) next.delete(label.id);
    else next.add(label.id);
    setApplied(next);
    run(`toggle-${label.id}`, () =>
      isApplied
        ? api.delete(`/cards/${card.id}/labels/${label.id}`)
        : api.post(`/cards/${card.id}/labels`, { labelId: label.id }),
    ).then((ok) => {
      if (!ok) setApplied(applied);
    });
  }

  function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Dê um nome à etiqueta.");
      return;
    }
    run("create", async () => {
      const { data } = await api.post<{ label: Label }>(`/boards/${boardId}/labels`, {
        name: name.trim(),
        color,
      });
      if (card) {
        await api.post(`/cards/${card.id}/labels`, { labelId: data.label.id });
        setApplied((prev) => new Set(prev).add(data.label.id));
      }
      setName("");
    });
  }

  function saveEdit(labelId: string) {
    run(`edit-${labelId}`, async () => {
      await api.patch(`/labels/${labelId}`, { name: editName.trim(), color: editColor });
      setEditingId(null);
    });
  }

  function remove(label: Label) {
    const uses = label.cardCount ?? 0;
    const message =
      uses > 0
        ? `Excluir a etiqueta “${label.name}”? Ela será removida de ${uses} card(s).`
        : `Excluir a etiqueta “${label.name}”?`;
    if (!window.confirm(message)) return;
    run(`delete-${label.id}`, () => api.delete(`/labels/${label.id}`));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={484}
      title={card ? "Etiquetas do card" : "Etiquetas do quadro"}
      subtitle={
        card
          ? isAdmin
            ? "Marque as etiquetas aplicadas a este card ou crie uma nova."
            : "Marque as etiquetas aplicadas a este card."
          : isAdmin
            ? "Crie, renomeie ou exclua as etiquetas usadas para filtrar os cards."
            : "Etiquetas disponíveis neste quadro. Apenas administradores podem gerenciá-las."
      }
    >
      <div className="flex flex-col gap-2">
        {labels.length === 0 && (
          <p className="rounded-lg border border-dashed border-dash px-4 py-5 text-center text-[14.5px] text-muted">
            Nenhuma etiqueta criada ainda.
          </p>
        )}
        {labels.map((label) =>
          editingId === label.id ? (
            <div key={label.id} className="flex flex-col gap-3 rounded-lg border border-navy bg-surface p-3">
              <div className="flex gap-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <IconButton icon={Check} label="Salvar" size={44} onClick={() => saveEdit(label.id)} />
                <IconButton icon={X} label="Cancelar" size={44} onClick={() => setEditingId(null)} />
              </div>
              <ColorSwatches colors={SWATCHES} value={editColor} onChange={setEditColor} size="sm" />
            </div>
          ) : (
            <div
              key={label.id}
              className="flex h-[45px] items-center gap-3 rounded-lg border border-border bg-surface px-[17px]"
            >
              {card && (
                <Checkbox
                  checked={applied.has(label.id)}
                  onChange={() => toggle(label)}
                  disabled={busy === `toggle-${label.id}`}
                  label={`Aplicar ${label.name}`}
                />
              )}
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: label.color }} />
              <span className="flex-1 truncate text-[15.5px] text-ink">{label.name || "Sem nome"}</span>
              <span className="font-mono text-xs text-placeholder" title="Cards com esta etiqueta">
                {label.cardCount ?? 0}
              </span>
              {isAdmin && (
                <div className="flex gap-1">
                  <IconButton
                    icon={Pencil}
                    label="Editar etiqueta"
                    size={28}
                    onClick={() => {
                      setEditingId(label.id);
                      setEditName(label.name);
                      setEditColor(label.color);
                    }}
                  />
                  <IconButton icon={Trash} label="Excluir etiqueta" size={28} onClick={() => remove(label)} />
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {isAdmin && (
        <form
          onSubmit={create}
          className="flex flex-col gap-2.5 rounded-[10px] border border-border bg-surface-alt p-4"
        >
          <span className="text-[13.5px] font-medium text-body">Nova etiqueta</span>
          <div className="flex items-center gap-2">
            <Input
              className="h-[42px]"
              placeholder="Nome"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" className="h-[42px]" loading={busy === "create"}>
              Criar
            </Button>
          </div>
          <div className="pt-1">
            <ColorSwatches colors={SWATCHES} value={color} onChange={setColor} size="sm" />
          </div>
        </form>
      )}

      {error && <p className="rounded-lg bg-red-bg px-3 py-2 text-sm text-red-dark">{error}</p>}

      <div className="flex justify-end pt-1.5">
        <Button onClick={onClose}>Concluído</Button>
      </div>
    </Modal>
  );
}
