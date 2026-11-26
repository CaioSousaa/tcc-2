import { AppDataSource } from "../../database";
import { Card } from "../../entities/Card";
import { List } from "../../entities/List";
import { AppError } from "../../utils/AppError";
import { moveItem } from "../../utils/reorder";

const lists = () => AppDataSource.getRepository(List);

export async function createList(boardId: string, name: string, position?: number) {
  return AppDataSource.transaction(async (manager) => {
    const all = await manager.find(List, { where: { boardId }, order: { position: "ASC" } });
    const index = position === undefined ? all.length : Math.min(position, all.length);
    const list = await manager.save(
      manager.create(List, { boardId, name: name.trim(), position: index }),
    );
    for (let i = index; i < all.length; i++) {
      await manager.update(List, { id: all[i].id }, { position: i + 1 });
    }
    return { id: list.id, name: list.name, position: list.position, cards: [] };
  });
}

export async function renameList(listId: string, name: string) {
  await lists().update({ id: listId }, { name: name.trim() });
  return { id: listId, name: name.trim() };
}

export async function moveList(boardId: string, listId: string, position: number) {
  await AppDataSource.transaction(async (manager) => {
    const all = await manager.find(List, {
      where: { boardId },
      order: { position: "ASC" },
    });
    const from = all.findIndex((l) => l.id === listId);
    const ordered = moveItem(all, from, position);
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].position !== i) {
        await manager.update(List, { id: ordered[i].id }, { position: i });
      }
    }
  });
}

export async function deleteList(
  boardId: string,
  listId: string,
  strategy: "delete" | "move" | undefined,
  targetListId: string | undefined,
) {
  await AppDataSource.transaction(async (manager) => {
    const cards = await manager.find(Card, {
      where: { listId },
      order: { position: "ASC" },
    });

    if (cards.length > 0) {
      if (!strategy) {
        throw new AppError(
          409,
          "A lista possui cards. Escolha excluí-los ou movê-los para outra lista.",
          { cardCount: cards.length },
        );
      }
      if (strategy === "move") {
        if (!targetListId || targetListId === listId) {
          throw new AppError(400, "Informe uma lista de destino válida");
        }
        const target = await manager.findOne(List, {
          where: { id: targetListId, boardId },
        });
        if (!target) {
          throw new AppError(400, "A lista de destino deve ser do mesmo quadro");
        }
        const base = await manager.count(Card, { where: { listId: targetListId } });
        for (let i = 0; i < cards.length; i++) {
          await manager.update(
            Card,
            { id: cards[i].id },
            { listId: targetListId, position: base + i },
          );
        }
      }
    }

    await manager.delete(List, { id: listId });

    const remaining = await manager.find(List, {
      where: { boardId },
      order: { position: "ASC" },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await manager.update(List, { id: remaining[i].id }, { position: i });
      }
    }
  });
}
