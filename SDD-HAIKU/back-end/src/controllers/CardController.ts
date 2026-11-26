import { Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CardService } from "../services/CardService";
import { CreateCardDto, UpdateCardDto, MoveCardDto, ReorderCardsDto } from "../dtos/card.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export class CardController {
  private cardService: CardService;

  constructor() {
    this.cardService = new CardService();
  }

  private getParam(param: string | string[]): string {
    return Array.isArray(param) ? param[0] : param;
  }

  async createCard(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(CreateCardDto, req.body);
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
      const card = await this.cardService.createCard(
        listId,
        dto.title,
        req.user!.userId
      );

      return res.status(201).json({
        success: true,
        data: card,
        message: "Card criado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "create_error",
        message: error.message,
      });
    }
  }

  async getCardById(req: AuthenticatedRequest, res: Response) {
    try {
      const cardId = this.getParam(req.params.cardId);
      const card = await this.cardService.getCardById(
        cardId,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: card,
        message: "Card recuperado com sucesso",
      });
    } catch (error: any) {
      return res.status(404).json({
        success: false,
        error: "not_found",
        message: error.message,
      });
    }
  }

  async updateCard(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(UpdateCardDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const cardId = this.getParam(req.params.cardId);
      const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

      const card = await this.cardService.updateCard(
        cardId,
        {
          title: dto.title,
          description: dto.description,
          dueDate,
        },
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: card,
        message: "Card atualizado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "update_error",
        message: error.message,
      });
    }
  }

  async deleteCard(req: AuthenticatedRequest, res: Response) {
    try {
      const cardId = this.getParam(req.params.cardId);
      await this.cardService.deleteCard(cardId, req.user!.userId);

      return res.status(200).json({
        success: true,
        message: "Card deletado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "delete_error",
        message: error.message,
      });
    }
  }

  async moveCard(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(MoveCardDto, req.body);
      const errors = await validate(dto);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors,
        });
      }

      const cardId = this.getParam(req.params.cardId);
      const card = await this.cardService.moveCard(
        cardId,
        dto.listId,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        data: card,
        message: "Card movido com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "move_error",
        message: error.message,
      });
    }
  }

  async reorderCards(req: AuthenticatedRequest, res: Response) {
    try {
      const dto = plainToInstance(ReorderCardsDto, req.body);
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
      await this.cardService.reorderCards(
        listId,
        dto.cardIds,
        req.user!.userId
      );

      return res.status(200).json({
        success: true,
        message: "Cards reordenados com sucesso",
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
