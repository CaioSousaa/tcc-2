import { AppDataSource } from "../database";
import { Board } from "../entities/Board";
import { List } from "../entities/List";
import { Card } from "../entities/Card";

const boardRepository = AppDataSource.getRepository(Board);
const listRepository = AppDataSource.getRepository(List);
const cardRepository = AppDataSource.getRepository(Card);

export class BoardService {
  static async createBoard(userId: string, title: string, description?: string) {
    const board = boardRepository.create({
      owner: { id: userId },
      title,
      description: description || "",
    });

    return await boardRepository.save(board);
  }

  static async getBoardsForUser(userId: string) {
    const boards = await boardRepository.find({
      where: { owner: { id: userId } },
      relations: { lists: true },
    });

    return boards;
  }

  static async getBoardDetail(boardId: string, userId: string) {
    const board = await boardRepository.findOne({
      where: { id: boardId },
      relations: { lists: { cards: { assignees: { user: true }, checklists: { items: true }, comments: { user: true }, labels: { label: true } } }, members: { user: true }, labels: true },
    });

    if (!board) throw new Error("Board not found");

    // Check permission (owner or member)
    const isMember = board.members?.some((m) => m.user.id === userId);
    if (board.owner.id !== userId && !isMember) {
      throw new Error("Unauthorized");
    }

    return board;
  }

  static async updateBoard(boardId: string, userId: string, title: string, description: string) {
    const board = await boardRepository.findOneBy({ id: boardId });

    if (!board) throw new Error("Board not found");
    if (board.owner.id !== userId) throw new Error("Unauthorized");

    board.title = title;
    board.description = description;

    return await boardRepository.save(board);
  }

  static async deleteBoard(boardId: string, userId: string) {
    const board = await boardRepository.findOneBy({ id: boardId });

    if (!board) throw new Error("Board not found");
    if (board.owner.id !== userId) throw new Error("Unauthorized");

    await boardRepository.remove(board);
  }
}
