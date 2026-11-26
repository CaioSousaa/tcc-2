import { CommentRepository } from "../repositories/CommentRepository";
import { CardRepository } from "../repositories/CardRepository";
import { ListRepository } from "../repositories/ListRepository";
import { BoardService } from "./BoardService";
import { Comment } from "../entities/Comment";

export class CommentService {
  private commentRepo: CommentRepository;
  private cardRepo: CardRepository;
  private listRepo: ListRepository;
  private boardService: BoardService;

  constructor() {
    this.commentRepo = new CommentRepository();
    this.cardRepo = new CardRepository();
    this.listRepo = new ListRepository();
    this.boardService = new BoardService();
  }

  async getCommentsByCard(cardId: string, userId: string): Promise<Comment[]> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    return this.commentRepo.findByCardId(cardId);
  }

  async createComment(cardId: string, authorId: string, text: string, userId: string): Promise<Comment> {
    const card = await this.cardRepo.findById(cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    await this.boardService.canModify(list.boardId, userId);
    return this.commentRepo.create(cardId, authorId, text);
  }

  async updateComment(id: string, text: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) throw new Error("Comentário não encontrado");

    if (comment.authorId !== userId) {
      throw new Error("Apenas o autor pode editar o comentário");
    }

    const updated = await this.commentRepo.update(id, text);
    if (!updated) throw new Error("Falha ao atualizar comentário");
    return updated;
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    const comment = await this.commentRepo.findById(id);
    if (!comment) throw new Error("Comentário não encontrado");

    const card = await this.cardRepo.findById(comment.cardId);
    if (!card) throw new Error("Card não encontrado");

    const list = await this.listRepo.findById(card.listId);
    if (!list) throw new Error("Lista não encontrada");

    if (comment.authorId !== userId) {
      await this.boardService.canModify(list.boardId, userId);
    }

    await this.commentRepo.delete(id);
  }
}
