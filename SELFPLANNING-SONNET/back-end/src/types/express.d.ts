import { BoardRole } from "../entities/BoardMember";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      boardId: string;
      boardRole: BoardRole;
    }
  }
}

export {};
