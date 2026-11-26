"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { api, toApiError } from "@/lib/api";
import { assigneeMembers, toggleAssignee } from "@/lib/assignees";
import { LIMITS, ROLE_LABELS } from "@/lib/constants";
import { isValidCalendarDate } from "@/lib/date";
import { can } from "@/lib/permissions";
import type { CardDetail } from "@/lib/types";
import { charCount, validateText } from "@/lib/validation";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DueBadge } from "@/components/ui/DueBadge";
import { LabelChip } from "@/components/ui/LabelChip";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useBoardContext } from "./BoardContext";
import { ChecklistSection } from "./ChecklistSection";
import { CommentsSection } from "./CommentsSection";
import { LabelsDialog } from "./LabelsDialog";

interface CardDetailBodyProps {
  detail: CardDetail;
  onChange: (next: CardDetail) => void;
}

export function CardDetailBody({ detail, onChange }: CardDetailBodyProps) {
  const { role, data, today, reload, openCard } = useBoardContext();
  const toast = useToast();
  const canEdit = can(role, "card.manage");
  const list = data.lists.find((item) => item.id === detail.listId);

  // Título, descrição e prazo são rascunhos salvos juntos em "Salvar card"; as demais ações valem na hora.
  const [title, setTitle] = useState(detail.title);
  const [description, setDescription] = useState(detail.description ?? "");
  const [dueDate, setDueDate] = useState(detail.dueDate ?? "");
  const [errors, setErrors] = useState<{ title?: string; description?: string; dueDate?: string }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [pickingAssignees, setPickingAssignees] = useState(false);
  const [busy, setBusy] = useState(false);

  const titleChanged = title.trim() !== detail.title;
  const descriptionChanged = description.trim() !== (detail.description ?? "");
  const dueChanged = dueDate !== (detail.dueDate ?? "");
  const dirty = titleChanged || descriptionChanged || dueChanged;

  async function save() {
    const next: typeof errors = {};
    if (titleChanged) {
      const invalid = validateText(title, "Título do card", LIMITS.cardTitle.min, LIMITS.cardTitle.max);
      if (invalid) next.title = invalid;
    }
    if (descriptionChanged && charCount(description.trim()) > LIMITS.cardDescription.max) {
      next.description = `A descrição deve ter no máximo ${LIMITS.cardDescription.max} caracteres.`;
    }
    if (dueChanged && dueDate !== "" && !isValidCalendarDate(dueDate)) {
      next.dueDate = "Informe uma data válida.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const patch: Record<string, string | null> = {};
    if (titleChanged) patch.title = title;
    if (descriptionChanged) patch.description = description;
    if (dueChanged) patch.dueDate = dueDate === "" ? null : dueDate;

    setSaving(true);
    try {
      const response = await api.patch<CardDetail>(`/cards/${detail.id}`, patch);
      onChange(response.data);
      setTitle(response.data.title);
      setDescription(response.data.description ?? "");
      setDueDate(response.data.dueDate ?? "");
      toast("Card salvo.", "success");
    } catch (cause) {
      const apiError = toApiError(cause);
      setErrors({
        title: apiError.fieldMessage("title"),
        description: apiError.fieldMessage("description"),
        dueDate: apiError.fieldMessage("dueDate"),
      });
      toast(apiError.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function patchNow(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await api.patch<CardDetail>(`/cards/${detail.id}`, patch);
      onChange({
        ...detail,
        completed: response.data.completed,
        dueDate: response.data.dueDate,
      });
      if ("dueDate" in patch) setDueDate(response.data.dueDate ?? "");
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function moveTo(listId: string, position: number) {
    setBusy(true);
    try {
      await api.post(`/cards/${detail.id}/move`, { listId, position });
      onChange({ ...detail, listId });
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    } finally {
      setBusy(false);
      await reload();
    }
  }

  async function toggleMember(userId: string) {
    const has = detail.assigneeIds.includes(userId);
    try {
      if (has) await api.delete(`/cards/${detail.id}/assignees/${userId}`);
      else await api.put(`/cards/${detail.id}/assignees/${userId}`);
      onChange({ ...detail, assigneeIds: toggleAssignee(detail.assigneeIds, userId) });
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    }
  }

  async function remove() {
    try {
      await api.delete(`/cards/${detail.id}`);
    } catch (cause) {
      toast(toApiError(cause).message, "error");
    }
    setDeleting(false);
    openCard(null);
    await reload();
  }

  const labels = data.labels.filter((label) => detail.labelIds.includes(label.id));
  const assigned = assigneeMembers(data.members, detail.assigneeIds);
  const currentIndex = list?.cards.findIndex((card) => card.id === detail.id) ?? 0;
  const savedDue = { dueDate: detail.dueDate, completed: detail.completed };

  return (
    <div>
      <header className="flex items-start justify-between gap-4 border-b border-border px-[26px] pb-5 pt-6">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[1.6px] text-muted">
            Card · {list?.name ?? "—"}
          </p>
          {canEdit ? (
            <div>
              <input
                aria-label="Título do card"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="block w-full rounded-md border border-transparent bg-transparent text-[22px] font-bold tracking-[-0.3px] text-ink hover:border-border focus:border-navy focus:outline-none"
              />
              {errors.title ? (
                <p role="alert" className="text-[13px] text-red">
                  {errors.title}
                </p>
              ) : null}
            </div>
          ) : (
            <h2 className="break-words text-[22px] font-bold tracking-[-0.3px] text-ink">{detail.title}</h2>
          )}
        </div>
        <IconButton icon={X} label="Fechar" size={32} onClick={() => openCard(null)} />
      </header>

      <div className="flex flex-col md:flex-row">
        <div className="min-w-0 flex-1 space-y-6 p-[26px]">
          <section className="space-y-2">
            <h4 className="text-[13.5px] font-medium text-body">Descrição</h4>
            {canEdit ? (
              <>
                <textarea
                  rows={4}
                  aria-label="Descrição do card"
                  placeholder="Adicione uma descrição"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="block w-full rounded-lg border border-border bg-surface p-3.5 text-[15px] leading-normal text-ink placeholder:text-placeholder focus:outline-2 focus:outline-navy"
                />
                {errors.description ? (
                  <p role="alert" className="text-[13px] text-red">
                    {errors.description}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="rounded-lg border border-border p-3.5 text-[15px] leading-normal">
                {detail.description ? (
                  <p className="whitespace-pre-wrap break-words text-ink">{detail.description}</p>
                ) : (
                  <p className="text-placeholder">Sem descrição.</p>
                )}
              </div>
            )}
          </section>

          <ChecklistSection detail={detail} canEdit={can(role, "checklist.manage")} onChange={onChange} />
          <CommentsSection detail={detail} canComment={can(role, "comment.create")} onChange={onChange} />
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-[22px] border-t border-border bg-surface-alt p-[22px] md:w-[261px] md:border-l md:border-t-0">
          <div className="space-y-[9px]">
            <p className="text-[13px] font-medium text-muted">Lista</p>
            {canEdit ? (
              <div className="space-y-2">
                <Select
                  id="card-list"
                  aria-label="Lista do card"
                  compact
                  value={detail.listId}
                  disabled={busy}
                  onChange={(event) => {
                    const target = data.lists.find((item) => item.id === event.target.value);
                    void moveTo(event.target.value, target ? target.cards.length : 0);
                  }}
                >
                  {data.lists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
                <Select
                  id="card-position"
                  aria-label="Posição na lista"
                  compact
                  value={Math.max(0, currentIndex)}
                  disabled={busy}
                  onChange={(event) => void moveTo(detail.listId, Number(event.target.value))}
                >
                  {Array.from({ length: list?.cards.length ?? 1 }, (_, index) => (
                    <option key={index} value={index}>
                      Posição {index + 1}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <p className="text-[15px] text-ink">{list?.name}</p>
            )}
          </div>

          <div className="space-y-[9px]">
            <p className="text-[13px] font-medium text-muted">Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {labels.length === 0 ? <span className="text-[13.5px] text-placeholder">Sem etiquetas.</span> : null}
              {labels.map((label) => (
                <LabelChip key={label.id} label={label} large />
              ))}
            </div>
            {canEdit ? (
              <button
                type="button"
                onClick={() => setLabelsOpen(true)}
                className="flex h-[34px] items-center rounded-md border border-border bg-surface px-3 text-[13.5px] text-ink hover:bg-surface-alt"
              >
                Gerenciar etiquetas
              </button>
            ) : null}
          </div>

          <div className="space-y-[9px]">
            <p className="text-[13px] font-medium text-muted">Responsáveis</p>
            <div className="flex flex-wrap items-center gap-[7px]">
              {assigned.map((member) => (
                <Avatar key={member.userId} id={member.userId} name={member.name} size={32} />
              ))}
              {assigned.length === 0 ? <span className="text-[13.5px] text-placeholder">Sem responsáveis.</span> : null}
              {can(role, "assignee.manage") ? (
                <button
                  type="button"
                  aria-label="Editar responsáveis"
                  aria-expanded={pickingAssignees}
                  onClick={() => setPickingAssignees((value) => !value)}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-outline-soft bg-surface text-muted hover:bg-surface-alt"
                >
                  <Plus size={12} aria-hidden />
                </button>
              ) : null}
            </div>
            {pickingAssignees ? (
              <ul className="space-y-2 rounded-lg border border-border bg-surface p-3">
                {data.members.map((member) => (
                  <li key={member.userId}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
                      <Checkbox
                        checked={detail.assigneeIds.includes(member.userId)}
                        onChange={() => void toggleMember(member.userId)}
                        label={`Atribuir a ${member.name}`}
                      />
                      <Avatar id={member.userId} name={member.name} size={22} />
                      <span className="min-w-0 flex-1 truncate">{member.name}</span>
                      <span className="text-xs text-placeholder">{ROLE_LABELS[member.role]}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="space-y-[9px]">
            <p className="text-[13px] font-medium text-muted">Prazo</p>
            {canEdit ? (
              <>
                <input
                  type="date"
                  aria-label="Data do prazo"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="block h-10 w-full rounded-lg border border-border bg-surface px-3.5 text-[15px] text-ink focus:outline-2 focus:outline-navy"
                />
                {errors.dueDate ? (
                  <p role="alert" className="text-[13px] text-red">
                    {errors.dueDate}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-[15px] text-ink">{detail.dueDate ? "" : "Sem prazo."}</p>
            )}
            <DueBadge card={savedDue} today={today} wide />
            {canEdit && detail.dueDate ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void patchNow({ dueDate: null })}
                className="text-[13px] text-muted underline hover:text-ink disabled:opacity-60"
              >
                Remover prazo
              </button>
            ) : null}
            {canEdit ? (
              <label className="flex cursor-pointer items-center gap-2.5 pt-1 text-[14.5px] text-ink">
                <Checkbox
                  checked={detail.completed}
                  disabled={busy}
                  onChange={(checked) => void patchNow({ completed: checked })}
                  label="Marcar card como concluído"
                />
                Concluído
              </label>
            ) : detail.completed ? (
              <p className="text-[14.5px] font-medium text-green">Concluído</p>
            ) : null}
          </div>

          {canEdit ? (
            <div className="mt-auto space-y-2.5 pt-2">
              <Button className="h-10 w-full" loading={saving} disabled={!dirty} onClick={save}>
                Salvar card
              </Button>
              <Button
                variant="secondary"
                className="h-10 w-full border-danger-line text-red-dark"
                onClick={() => setDeleting(true)}
              >
                Excluir card
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <LabelsDialog
        open={labelsOpen}
        onClose={() => setLabelsOpen(false)}
        card={{
          id: detail.id,
          labelIds: detail.labelIds,
          onChange: (labelIds) => onChange({ ...detail, labelIds }),
        }}
      />
      <ConfirmDialog
        open={deleting}
        title={`Excluir o card “${detail.title}”?`}
        confirmLabel="Excluir card"
        onConfirm={remove}
        onClose={() => setDeleting(false)}
      >
        <p>Checklists, comentários e atribuições do card serão removidos definitivamente.</p>
      </ConfirmDialog>
    </div>
  );
}
