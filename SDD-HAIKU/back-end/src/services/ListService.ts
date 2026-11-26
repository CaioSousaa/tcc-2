import { ListRepository } from "../repositories/ListRepository";
import { BoardService } from "./BoardService";
import { List } from "../entities/List";

export class ListService {
  private listRepo: ListRepository;
  private boardService: BoardService;

  constructor() {
    this.listRepo = new ListRepository();
    this.boardService = new BoardService();
  }

  async createList(
    boardId: string,
    name: string,
    userId: string
  ): Promise<List> {
    await this.boardService.canModify(boardId, userId);

    const maxOrder = await this.listRepo.getMaxOrder(boardId);
    return this.listRepo.create(boardId, name, maxOrder + 1);
  }

  async getListById(id: string, userId: string): Promise<List> {
    const list = await this.listRepo.findById(id);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    return list;
  }

  async updateList(
    id: string,
    name: string,
    userId: string
  ): Promise<List> {
    const list = await this.listRepo.findById(id);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    const updated = await this.listRepo.update(id, name);
    if (!updated) throw new Error("Falha ao atualizar lista");
    return updated;
  }

  async deleteList(id: string, userId: string): Promise<void> {
    const list = await this.listRepo.findById(id);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    await this.listRepo.delete(id);
  }

  async reorderLists(
    boardId: string,
    listIds: string[],
    userId: string
  ): Promise<void> {
    await this.boardService.canModify(boardId, userId);

    for (let i = 0; i < listIds.length; i++) {
      await this.listRepo.updateOrder(listIds[i], i);
    }
  }
}
