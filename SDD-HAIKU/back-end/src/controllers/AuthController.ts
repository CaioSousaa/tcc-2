import { Request, Response } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { AuthService } from "../services/AuthService";
import { RegisterDto, LoginDto } from "../dtos/auth.dto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { UserRepository } from "../repositories/UserRepository";

export class AuthController {
  private authService: AuthService;
  private userRepo: UserRepository;

  constructor() {
    this.authService = new AuthService();
    this.userRepo = new UserRepository();
  }

  async register(req: Request, res: Response) {
    try {
      const dto = plainToInstance(RegisterDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        });
      }

      const result = await this.authService.register(dto);
      return res.status(201).json({
        success: true,
        data: result,
        message: "Cadastro realizado com sucesso",
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: "register_error",
        message: error.message,
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const dto = plainToInstance(LoginDto, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: "validation_error",
          message: "Validação falhou",
          details: errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        });
      }

      const result = await this.authService.login(dto);
      return res.status(200).json({
        success: true,
        data: result,
        message: "Login realizado com sucesso",
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: "login_error",
        message: error.message,
      });
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = await this.userRepo.findById(req.user!.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "user_not_found",
          message: "Usuário não encontrado",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: "Usuário recuperado com sucesso",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: "server_error",
        message: error.message,
      });
    }
  }

  async logout(req: Request, res: Response) {
    return res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  }
}
