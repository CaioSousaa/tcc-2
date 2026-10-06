import { LabelRepository } from "../repositories/LabelRepository";
import { BoardService } from "./BoardService";
import { Label } from "../entities/Label";

export class LabelService {
  private labelRepo: LabelRepository;
  private boardService: BoardService;

  constructor() {
    this.labelRepo = new LabelRepository();
    this.boardService = new BoardService();
  }

  async getLabelsByBoard(boardId: string, userId: string): Promise<Label[]> {
    await this.boardService.getBoardById(boardId, userId);
    return this.labelRepo.findByBoardId(boardId);
  }

  async createLabel(boardId: string, name: string, color: string, userId: string): Promise<Label> {
    await this.boardService.canModify(boardId, userId);
    return this.labelRepo.create(boardId, name, color);
  }

  async deleteLabel(id: string, userId: string): Promise<void> {
    const label = await this.labelRepo.findById(id);
    if (!label) throw new Error("Etiqueta não encontrada");

    await this.boardService.canModify(label.boardId, userId);
    await this.labelRepo.delete(id);
  }
}
