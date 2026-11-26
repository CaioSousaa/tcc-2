import { Response } from "express";
import { OrderService } from "../services/OrderService";
import { AuthRequest } from "../middleware/auth";

export class OrderController {
  static async checkout(req: AuthRequest, res: Response) {
    try {
      const { address, zipCode } = req.body;
      const userId = req.userId!;

      if (!address || !zipCode) {
        return res.status(400).json({ error: "Address and zip code required" });
      }

      const order = await OrderService.checkout(userId, address, zipCode);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getOrder(req: AuthRequest, res: Response) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      const order = await OrderService.getOrder(id);
      res.json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getUserOrders(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const orders = await OrderService.getUserOrders(userId, start, end);
      res.json(orders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
