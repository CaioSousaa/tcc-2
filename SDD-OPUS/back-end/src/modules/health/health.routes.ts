import { Router } from "express";
import { AppDataSource } from "../../database";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await AppDataSource.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error" });
  }
});
