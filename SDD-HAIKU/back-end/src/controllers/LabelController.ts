import { Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { LabelService } from "../services/LabelService";
import { CreateLabelDto } from "../dtos/label.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class LabelController {
  private labelService: LabelService;

  constructor() {
    this.labelService = new LabelService();
  }

  private getParam(param: string | string[]): string {
    return Array.isArray(param) ? param[0] : param;
  }

  async getLabelsByBoard(req: AuthenticatedRequest, res: Response) {
    try {
      const boardId = this.getParam(req.params.boardId);
      const labels = await this.labelService.getLabelsByBoard(
        boardId,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: labels,
        message: "Etiquetas recuperadas com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "fetch_error",
        message: error.message,
      });
    }
  }

  async createLabel(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateLabelDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          details: errors,
        });
      }

      const boardId = this.getParam(req.params.boardId);
      const label = await this.labelService.createLabel(
        boardId,
        dto.name,
        dto.color,
        req.user!.userId
      );

      return res.status(201).json({
        success: true,
        data: label,
        message: "Etiqueta criada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async deleteLabel(req: AuthenticatedRequest, res: Response) {
    try {
      const labelId = this.getParam(req.params.labelId);
      await this.labelService.deleteLabel(labelId, req.user!.userId);

      return res.status(200).json({
        success: true,
        message: "Etiqueta deletada com sucesso",
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
