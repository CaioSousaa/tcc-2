import { Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CommentService } from "../services/CommentService";
import { CreateCommentDto, UpdateCommentDto } from "../dtos/comment.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  private getParam(param: string | string[]): string {
    return Array.isArray(param) ? param[0] : param;
  }

  async getCommentsByCard(req: AuthenticatedRequest, res: Response) {
    try {
      const cardId = this.getParam(req.params.cardId);
      const comments = await this.commentService.getCommentsByCard(
        cardId,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: comments,
        message: "Comentários recuperados com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "fetch_error",
        message: error.message,
      });
    }
  }

  async createComment(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateCommentDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          details: errors,
        });
      }

      const cardId = this.getParam(req.params.cardId);
      const comment = await this.commentService.createComment(
        cardId,
        req.user!.userId,
        dto.text,
        req.user!.userId
      );

      return res.status(201).json({
        success: true,
        data: comment,
        message: "Comentário criado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async updateComment(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(UpdateCommentDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          details: errors,
        });
      }

      const commentId = this.getParam(req.params.commentId);
      const comment = await this.commentService.updateComment(
        commentId,
        dto.text,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: comment,
        message: "Comentário atualizado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "update_error",
        message: error.message,
      });
    }
  }

  async deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
      const commentId = this.getParam(req.params.commentId);
      await this.commentService.deleteComment(commentId, req.user!.userId);

      return res.status(200).json({
        success: true,
        message: "Comentário deletado com sucesso",
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
