import { AppDataSource } from "../database";
import { List } from "../entities/List";

const listRepository = AppDataSource.getRepository(List);

export class ListService {
  static async createList(boardId: string, title: string) {
    const maxPosition = await listRepository
      .createQueryBuilder("list")
      .where("list.board.id = :boardId", { boardId })
      .select("MAX(list.position)", "max")
      .getRawOne();

    const position = (maxPosition?.max || 0) + 1;

    const list = listRepository.create({
      board: { id: boardId },
      title,
      position,
    });

    return await listRepository.save(list);
  }

  static async getListsByBoard(boardId: string) {
    const lists = await listRepository.find({
      where: { board: { id: boardId } },
      relations: { cards: true },
      order: { position: "ASC" },
    });

    return lists;
  }

  static async updateList(listId: string, title: string) {
    const list = await listRepository.findOneBy({ id: listId });

    if (!list) throw new Error("List not found");

    list.title = title;
    return await listRepository.save(list);
  }

  static async reorderList(listId: string, newPosition: number) {
    const list = await listRepository.findOneBy({ id: listId });

    if (!list) throw new Error("List not found");

    list.position = newPosition;
    return await listRepository.save(list);
  }

  static async deleteList(listId: string) {
    const list = await listRepository.findOneBy({ id: listId });

    if (!list) throw new Error("List not found");

    await listRepository.remove(list);
  }
}
