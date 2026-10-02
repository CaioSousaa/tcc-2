import { AppDataSource } from "../../database";
import { authorize, authorizeResource, boardIdOf } from "../../shared/board-access";
import { errors } from "../../shared/errors";
import { isUuid, type LabelColor } from "../../shared/validation";
import { labelNameKey } from "./labels.rules";

export interface LabelView {
  id: string;
  name: string;
  color: LabelColor;
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { driverError?: { code?: string } })?.driverError?.code === "23505";
}

export async function createLabel(
  userId: string,
  boardId: string,
  input: { name: string; color: LabelColor },
): Promise<LabelView> {
  try {
    return await AppDataSource.transaction(async (manager) => {
      await authorize(manager, userId, boardId, "label.manage");
      const rows: LabelView[] = await manager.query(
        `INSERT INTO labels (board_id, name, name_key, color) VALUES ($1, $2, $3, $4)
         RETURNING id, name, color`,
        [boardId, input.name, labelNameKey(input.name), input.color],
      );
      return rows[0];
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw errors.labelNameInUse();
    throw error;
  }
}

export async function updateLabel(
  userId: string,
  labelId: string,
  patch: { name?: string; color?: LabelColor },
): Promise<LabelView> {
  try {
    return await AppDataSource.transaction(async (manager) => {
      await authorizeResource(manager, userId, "label", labelId, "label.manage");

      const assignments: string[] = [];
      const values: unknown[] = [labelId];
      if (patch.name !== undefined) {
        values.push(patch.name, labelNameKey(patch.name));
        assignments.push(`name = $${values.length - 1}`, `name_key = $${values.length}`);
      }
      if (patch.color !== undefined) {
        values.push(patch.color);
        assignments.push(`color = $${values.length}`);
      }
      const rows: LabelView[] = await manager.query(
        `UPDATE labels SET ${assignments.join(", ")} WHERE id = $1 RETURNING id, name, color`,
        values,
      );
      if (rows.length === 0) throw errors.notFound("Etiqueta");
      return rows[0];
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw errors.labelNameInUse();
    throw error;
  }
}

/** A cascata do banco remove a etiqueta dos cards; os cards permanecem (CA-63). */
export async function deleteLabel(userId: string, labelId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    await authorizeResource(manager, userId, "label", labelId, "label.manage");
    await manager.query(`DELETE FROM labels WHERE id = $1`, [labelId]);
  });
}

/** Aplica a etiqueta ao card; só etiquetas do mesmo quadro (RN-26). Idempotente (RT-36). */
export async function applyLabel(userId: string, cardId: string, labelId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    const { boardId } = await authorizeResource(manager, userId, "card", cardId, "label.manage");
    if ((await boardIdOf(manager, "label", labelId)) !== boardId) throw errors.notFound("Etiqueta");
    await manager.query(
      `INSERT INTO card_labels (card_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [cardId, labelId],
    );
  });
}

export async function removeLabelFromCard(
  userId: string,
  cardId: string,
  labelId: string,
): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    await authorizeResource(manager, userId, "card", cardId, "label.manage");
    if (!isUuid(labelId)) throw errors.notFound("Etiqueta");
    await manager.query(`DELETE FROM card_labels WHERE card_id = $1 AND label_id = $2`, [
      cardId,
      labelId,
    ]);
  });
}
