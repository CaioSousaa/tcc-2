import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/AuthService";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "unauthorized",
      message: "Token não fornecido",
    });
  }

  const token = authHeader.substring(7);

  try {
    const authService = new AuthService();
    const decoded: any = authService.validateToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: "unauthorized",
      message: error.message || "Token inválido",
    });
  }
};
