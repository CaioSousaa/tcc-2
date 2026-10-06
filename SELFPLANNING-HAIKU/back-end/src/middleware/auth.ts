import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User ID required" });
  }

  req.userId = userId;
  next();
};
