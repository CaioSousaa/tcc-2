import { AppDataSource } from "../../database";
import { CardLabel } from "../../entities/CardLabel";
import { Label } from "../../entities/Label";
import { authorize, boardIdOfCard, boardIdOfLabel } from "../../shared/access";
import { isUniqueViolation } from "../../shared/db";
import { Errors } from "../../shared/errors";
import type { CreateLabelInput, UpdateLabelInput } from "./labels.schemas";
import { labelNameKey } from "./labels.rules";

export interface LabelDto {
  id: string;
  name: string;
  color: string;
}

const toDto = (label: Label): LabelDto => ({ id: label.id, name: label.name, color: label.color });

export async function createLabel(
  boardId: string,
  userId: string,
  input: CreateLabelInput,
): Promise<LabelDto> {
  await authorize(boardId, userId, "collaborator");

  const labels = AppDataSource.getRepository(Label);
  try {
    const label = await labels.save(
      labels.create({
        boardId,
        name: input.name,
        nameKey: labelNameKey(input.name),
        color: input.color,
      }),
    );
    return toDto(label);
  } catch (error) {
    if (isUniqueViolation(error)) throw Errors.labelNameInUse();
    throw error;
  }
}

export async function updateLabel(
  labelId: string,
  userId: string,
  input: UpdateLabelInput,
): Promise<LabelDto> {
  await authorize(await boardIdOfLabel(labelId), userId, "collaborator");

  const changes: Partial<Pick<Label, "name" | "nameKey" | "color">> = {};
  if (input.name !== undefined) {
    changes.name = input.name;
    changes.nameKey = labelNameKey(input.name);
  }
  if (input.color !== undefined) changes.color = input.color;

  const labels = AppDataSource.getRepository(Label);
  if (Object.keys(changes).length > 0) {
    try {
      const result = await labels.update({ id: labelId }, changes);
      if (result.affected === 0) throw Errors.notFound();
    } catch (error) {
      if (isUniqueViolation(error)) throw Errors.labelNameInUse();
      throw error;
    }
  }

  const label = await labels.findOneBy({ id: labelId });
  if (!label) throw Errors.notFound();
  return toDto(label);
}

/** Removes the label from every card it was on, without deleting the cards (RN-X4). */
export async function deleteLabel(labelId: string, userId: string): Promise<void> {
  await authorize(await boardIdOfLabel(labelId), userId, "collaborator");
  await AppDataSource.getRepository(Label).delete({ id: labelId });
}

/** Idempotent: applying a label twice leaves a single association (CA-E5). */
export async function applyLabel(cardId: string, labelId: string, userId: string): Promise<void> {
  const boardId = await boardIdOfCard(cardId);
  await authorize(boardId, userId, "collaborator");

  // RN-F1: the label must belong to the card's board; anything else looks nonexistent.
  const label = await AppDataSource.getRepository(Label).findOneBy({ id: labelId, boardId });
  if (!label) throw Errors.notFound();

  await AppDataSource.createQueryBuilder()
    .insert()
    .into(CardLabel)
    .values({ cardId, labelId })
    .orIgnore()
    .execute();
}

export async function removeLabelFromCard(
  cardId: string,
  labelId: string,
  userId: string,
): Promise<void> {
  await authorize(await boardIdOfCard(cardId), userId, "collaborator");
  await AppDataSource.getRepository(CardLabel).delete({ cardId, labelId });
}
