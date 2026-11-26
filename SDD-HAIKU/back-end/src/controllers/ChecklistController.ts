import { Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ChecklistService } from "../services/ChecklistService";
import { CreateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from "../dtos/checklist.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class ChecklistController {
  private checklistService: ChecklistService;

  constructor() {
    this.checklistService = new ChecklistService();
  }

  private getParam(param: string | string[]): string {
    return Array.isArray(param) ? param[0] : param;
  }

  async createChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateChecklistDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          details: errors,
        });
      }

      const cardId = this.getParam(req.params.cardId);
      const checklist = await this.checklistService.createChecklist(
        cardId,
        dto.title,
        req.user!.userId
      );

      return res.status(201).json({
        success: true,
        data: checklist,
        message: "Checklist criada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async updateChecklistTitle(req: AuthenticatedRequest, res: Response) {
    try {
      const checklistId = this.getParam(req.params.checklistId);
      const { title } = req.body;

      if (!title || typeof title !== "string") {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Título é obrigatório",
        });
      }

      const checklist = await this.checklistService.updateChecklistTitle(
        checklistId,
        title,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: checklist,
        message: "Checklist atualizada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "update_error",
        message: error.message,
      });
    }
  }

  async deleteChecklist(req: AuthenticatedRequest, res: Response) {
    try {
      const checklistId = this.getParam(req.params.checklistId);
      await this.checklistService.deleteChecklist(checklistId, req.user!.userId);

      return res.status(200).json({
        success: true,
        message: "Checklist deletada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "delete_error",
        message: error.message,
      });
    }
  }

  async createItem(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateChecklistItemDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          details: errors,
        });
      }

      const checklistId = this.getParam(req.params.checklistId);
      const item = await this.checklistService.createItem(
        checklistId,
        dto.text,
        req.user!.userId
      );

      return res.status(201).json({
        success: true,
        data: item,
        message: "Item criado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(UpdateChecklistItemDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          details: errors,
        });
      }

      const itemId = this.getParam(req.params.itemId);
      const item = await this.checklistService.updateItem(
        itemId,
        dto,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: item,
        message: "Item atualizado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "update_error",
        message: error.message,
      });
    }
  }

  async deleteItem(req: AuthenticatedRequest, res: Response) {
    try {
      const itemId = this.getParam(req.params.itemId);
      await this.checklistService.deleteItem(itemId, req.user!.userId);

      return res.status(200).json({
        success: true,
        message: "Item deletado com sucesso",
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
