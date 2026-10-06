import { AppDataSource } from "../../database";
import { Card } from "../../entities/Card";
import { Checklist } from "../../entities/Checklist";
import { ChecklistItem } from "../../entities/ChecklistItem";
import { AppError } from "../../utils/AppError";
import { computeProgress } from "../cards/card.serializer";

const checklists = () => AppDataSource.getRepository(Checklist);
const items = () => AppDataSource.getRepository(ChecklistItem);

async function progressOfCard(cardId: string) {
  const card = await AppDataSource.getRepository(Card).findOne({
    where: { id: cardId },
    relations: { checklists: { items: true } },
  });
  return card ? computeProgress(card) : null;
}

async function cardIdOfChecklist(checklistId: string) {
  const checklist = await checklists().findOne({ where: { id: checklistId } });
  if (!checklist) throw new AppError(404, "Checklist não encontrada");
  return checklist.cardId;
}

function itemView(item: ChecklistItem) {
  return {
    id: item.id,
    checklistId: item.checklistId,
    text: item.text,
    done: item.done,
    position: item.position,
  };
}

export async function createChecklist(cardId: string, title: string) {
  const position = await checklists().count({ where: { cardId } });
  const checklist = await checklists().save(
    checklists().create({ cardId, title: title.trim(), position }),
  );
  return {
    id: checklist.id,
    title: checklist.title,
    position,
    items: [],
    progress: await progressOfCard(cardId),
  };
}

export async function renameChecklist(checklistId: string, title: string) {
  await checklists().update({ id: checklistId }, { title: title.trim() });
  return { id: checklistId, title: title.trim() };
}

export async function deleteChecklist(checklistId: string) {
  const cardId = await cardIdOfChecklist(checklistId);
  await checklists().delete({ id: checklistId });
  return { progress: await progressOfCard(cardId) };
}

export async function createItem(checklistId: string, text: string) {
  const cardId = await cardIdOfChecklist(checklistId);
  const position = await items().count({ where: { checklistId } });
  const item = await items().save(
    items().create({ checklistId, text: text.trim(), done: false, position }),
  );
  return { item: itemView(item), progress: await progressOfCard(cardId) };
}

export async function updateItem(
  itemId: string,
  data: { text?: string; done?: boolean },
) {
  const item = await items().findOneByOrFail({ id: itemId });
  if (data.text !== undefined) item.text = data.text.trim();
  if (data.done !== undefined) item.done = data.done;
  await items().save(item);
  const cardId = await cardIdOfChecklist(item.checklistId);
  return { item: itemView(item), progress: await progressOfCard(cardId) };
}

export async function deleteItem(itemId: string) {
  const item = await items().findOneByOrFail({ id: itemId });
  const cardId = await cardIdOfChecklist(item.checklistId);
  await items().delete({ id: itemId });
  return { progress: await progressOfCard(cardId) };
}
