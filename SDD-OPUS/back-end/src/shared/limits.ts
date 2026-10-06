// Field limits from docs/spec.md §5 (after trimming) and docs/plan.md §5.1.
export const LIMITS = {
  userName: 100,
  email: 254,
  passwordMin: 8,
  passwordMax: 128,
  boardName: 100,
  boardDescription: 500,
  listName: 100,
  cardTitle: 200,
  cardDescription: 5000,
  checklistTitle: 100,
  checklistItemText: 200,
  labelName: 30,
  comment: 2000,
} as const;
