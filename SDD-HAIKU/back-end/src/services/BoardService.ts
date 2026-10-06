import { BoardRepository } from "../repositories/BoardRepository";
import { Board } from "../entities/Board";
import { CreateBoardDto, UpdateBoardDto } from "../dtos/board.dto";
import { BoardRole } from "../entities/BoardMember";

export class BoardService {
  private boardRepo: BoardRepository;

  constructor() {
    this.boardRepo = new BoardRepository();
  }

  async createBoard(dto: CreateBoardDto, userId: string): Promise<Board> {
    const board = await this.boardRepo.create(dto.name, userId);
    return board;
  }

  async getBoardById(id: string, userId: string): Promise<Board> {
    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new Error("Quadro não encontrado");
    }

    const isMember = board.members?.some((m) => m.userId === userId);
    if (board.ownerId !== userId && !isMember) {
      throw new Error("Você não tem acesso a este quadro");
    }

    return board;
  }

  async listBoardsByUser(userId: string): Promise<Board[]> {
    const boards = await this.boardRepo.findByOwnerId(userId);
    return boards;
  }

  async updateBoard(
    id: string,
    dto: UpdateBoardDto,
    userId: string
  ): Promise<Board> {
    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new Error("Quadro não encontrado");
    }

    if (board.ownerId !== userId) {
      throw new Error("Apenas o proprietário pode editar este quadro");
    }

    const updated = await this.boardRepo.update(id, dto.name);
    if (!updated) {
      throw new Error("Falha ao atualizar quadro");
    }
    return updated;
  }

  async deleteBoard(id: string, userId: string): Promise<void> {
    const board = await this.boardRepo.findById(id);
    if (!board) {
      throw new Error("Quadro não encontrado");
    }

    if (board.ownerId !== userId) {
      throw new Error("Apenas o proprietário pode deletar este quadro");
    }

    await this.boardRepo.delete(id);
  }

  async canModify(
    boardId: string,
    userId: string,
    requiredRole?: BoardRole
  ): Promise<boolean> {
    const board = await this.boardRepo.findById(boardId);
    if (!board) return false;

    if (board.ownerId === userId) return true;

    const member = board.members?.find((m) => m.userId === userId);
    if (!member) return false;

    if (!requiredRole) return true;

    const roleHierarchy: Record<BoardRole, number> = {
      [BoardRole.OWNER]: 4,
      [BoardRole.ADMIN]: 3,
      [BoardRole.MEMBER]: 2,
      [BoardRole.OBSERVER]: 1,
    };

    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }
}
