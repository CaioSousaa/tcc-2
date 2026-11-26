import { Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ListService } from "../services/ListService";
import { CreateListDto, UpdateListDto, ReorderListsDto } from "../dtos/list.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class ListController {
  private listService: ListService;

  constructor() {
    this.listService = new ListService();
  }

  private getParam(param: string | string[]): string {
    return Array.isArray(param) ? param[0] : param;
  }

  async createList(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateListDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const boardId = this.getParam(req.params.boardId);
      const list = await this.listService.createList(
        boardId,
        dto.name,
        req.user!.userId
      );

      return res.status(201).json({
        success: true,
        data: list,
        message: "Lista criada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async updateList(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(UpdateListDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const listId = this.getParam(req.params.listId);
      const list = await this.listService.updateList(
        listId,
        dto.name,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: list,
        message: "Lista atualizada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "update_error",
        message: error.message,
      });
    }
  }

  async deleteList(req: AuthenticatedRequest, res: Response) {
    try {
      const listId = this.getParam(req.params.listId);
      await this.listService.deleteList(listId, req.user!.userId);

      return res.status(200).json({
        success: true,
        message: "Lista deletada com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "delete_error",
        message: error.message,
      });
    }
  }

  async reorderLists(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(ReorderListsDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const boardId = this.getParam(req.params.boardId);
      await this.listService.reorderLists(
        boardId,
        dto.listIds,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        message: "Listas reordenadas com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "reorder_error",
        message: error.message,
      });
    }
  }
}
