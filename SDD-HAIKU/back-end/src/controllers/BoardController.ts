import { Request, Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { BoardService } from "../services/BoardService";
import { CreateBoardDto, UpdateBoardDto } from "../dtos/board.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class BoardController {
  private boardService: BoardService;

  constructor() {
    this.boardService = new BoardService();
  }

  private getBoardId(boardId: string | string[]): string {
    return Array.isArray(boardId) ? boardId[0] : boardId;
  }

  async createBoard(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateBoardDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const board = await this.boardService.createBoard(dto, req.user!.userId);
      return res.status(201).json({
        success: true,
        data: board,
        message: "Quadro criado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async listBoards(req: AuthenticatedRequest, res: Response) {
    try {
      const boards = await this.boardService.listBoardsByUser(
        req.user!.userId
      );
      return res.status(200).json({
        success: true,
        data: boards,
        message: "Quadros recuperados com sucesso",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: "server_error",
        message: error.message,
      });
    }
  }

  async getBoardById(req: AuthenticatedRequest, res: Response) {
    try {
      const boardId = this.getBoardId(req.params.boardId);
      const board = await this.boardService.getBoardById(
        boardId,
        req.user!.userId
      );
      return res.status(200).json({
        success: true,
        data: board,
        message: "Quadro recuperado com sucesso",
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        error: "not_found",
        message: error.message,
      });
    }
  }

  async updateBoard(req: AuthenticatedRequest, res: Response) {
    try {
      const boardId = this.getBoardId(req.params.boardId);
      const dto = plainToInstance(UpdateBoardDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const board = await this.boardService.updateBoard(
        boardId,
        dto,
        req.user!.userId
      );
      return res.status(200).json({
        success: true,
        data: board,
        message: "Quadro atualizado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "update_error",
        message: error.message,
      });
    }
  }

  async deleteBoard(req: AuthenticatedRequest, res: Response) {
    try {
      const boardId = this.getBoardId(req.params.boardId);
      await this.boardService.deleteBoard(boardId, req.user!.userId);
      return res.status(200).json({
        success: true,
        message: "Quadro deletado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "delete_error",
        message: error.message,
      });
    }
  }
}
