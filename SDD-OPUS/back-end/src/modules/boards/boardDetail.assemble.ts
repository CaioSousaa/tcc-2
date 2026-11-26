import type { Role } from "../../shared/roles";

// Row shapes of the constant set of queries behind GET /api/boards/:id (plan §6.2).

export interface BoardRow {
  id: string;
  name: string;
  description: string | null;
  role: Role;
}

export interface MemberRow {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

export interface LabelRow {
  id: string;
  name: string;
  color: string;
}

export interface ListRow {
  id: string;
  name: string;
  position: number;
}

export interface CardRow {
  id: string;
  listId: string;
  title: string;
  position: number;
  dueDate: string | null;
  completed: boolean;
}

export interface ProgressRow {
  cardId: string;
  checked: number;
  total: number;
}

export interface CardLabelRow {
  cardId: string;
  labelId: string;
}

export interface CardAssigneeRow {
  cardId: string;
  userId: string;
}

export interface BoardCardDto {
  id: string;
  listId: string;
  title: string;
  position: number;
  dueDate: string | null;
  completed: boolean;
  labelIds: string[];
  assigneeIds: string[];
  checklistChecked: number;
  checklistTotal: number;
}

export interface BoardDetailDto {
  id: string;
  name: string;
  description: string | null;
  role: Role;
  members: MemberRow[];
  labels: LabelRow[];
  lists: Array<ListRow & { cards: BoardCardDto[] }>;
}

function groupBy<T>(rows: readonly T[], key: (row: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = groups.get(key(row));
    if (bucket) bucket.push(row);
    else groups.set(key(row), [row]);
  }
  return groups;
}

/**
 * Pure assembly of the whole-board payload: lists ordered, each with its cards ordered, every
 * card carrying label ids, assignee ids and checklist counts (CardSummary, plan §4.5). Counts
 * default to 0/0 for cards without checklist items ("sem itens").
 */
export function assembleBoardDetail(input: {
  board: BoardRow;
  members: MemberRow[];
  labels: LabelRow[];
  lists: ListRow[];
  cards: CardRow[];
  progress: ProgressRow[];
  cardLabels: CardLabelRow[];
  cardAssignees: CardAssigneeRow[];
}): BoardDetailDto {
  const progressByCard = new Map(input.progress.map((row) => [row.cardId, row]));
  const labelsByCard = groupBy(input.cardLabels, (row) => row.cardId);
  const assigneesByCard = groupBy(input.cardAssignees, (row) => row.cardId);

  const toCard = (card: CardRow): BoardCardDto => ({
    id: card.id,
    listId: card.listId,
    title: card.title,
    position: card.position,
    dueDate: card.dueDate,
    completed: card.completed,
    labelIds: (labelsByCard.get(card.id) ?? []).map((row) => row.labelId),
    assigneeIds: (assigneesByCard.get(card.id) ?? []).map((row) => row.userId),
    checklistChecked: progressByCard.get(card.id)?.checked ?? 0,
    checklistTotal: progressByCard.get(card.id)?.total ?? 0,
  });

  const cardsByList = groupBy(input.cards, (card) => card.listId);
  const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

  return {
    id: input.board.id,
    name: input.board.name,
    description: input.board.description,
    role: input.board.role,
    members: input.members,
    labels: input.labels,
    lists: [...input.lists].sort(byPosition).map((list) => ({
      ...list,
      cards: [...(cardsByList.get(list.id) ?? [])].sort(byPosition).map(toCard),
    })),
  };
}
