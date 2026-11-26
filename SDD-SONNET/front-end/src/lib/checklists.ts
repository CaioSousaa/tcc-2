import type { Checklist, ChecklistItem, Progress } from "./types";

/** Itens feitos e total, somando todos os checklists do card (RN-20). */
export function countProgress(checklists: Checklist[]): Progress {
  let done = 0;
  let total = 0;
  for (const checklist of checklists) {
    for (const item of checklist.items) {
      total += 1;
      if (item.done) done += 1;
    }
  }
  return { done, total };
}

export function addChecklistLocal(checklists: Checklist[], checklist: Checklist): Checklist[] {
  return [...checklists, checklist];
}

export function renameChecklistLocal(
  checklists: Checklist[],
  checklistId: string,
  title: string,
): Checklist[] {
  return checklists.map((item) => (item.id === checklistId ? { ...item, title } : item));
}

export function removeChecklistLocal(checklists: Checklist[], checklistId: string): Checklist[] {
  return checklists.filter((item) => item.id !== checklistId);
}

export function addItemLocal(
  checklists: Checklist[],
  checklistId: string,
  item: ChecklistItem,
): Checklist[] {
  return checklists.map((checklist) =>
    checklist.id === checklistId ? { ...checklist, items: [...checklist.items, item] } : checklist,
  );
}

export function updateItemLocal(
  checklists: Checklist[],
  itemId: string,
  patch: Partial<Pick<ChecklistItem, "text" | "done">>,
): Checklist[] {
  return checklists.map((checklist) => ({
    ...checklist,
    items: checklist.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
  }));
}

export function removeItemLocal(checklists: Checklist[], itemId: string): Checklist[] {
  return checklists.map((checklist) => ({
    ...checklist,
    items: checklist.items.filter((item) => item.id !== itemId),
  }));
}
