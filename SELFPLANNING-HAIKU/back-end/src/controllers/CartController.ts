import { Response } from "express";
import { CartService } from "../services/CartService";
import { AuthRequest } from "../middleware/auth";

export class CartController {
  static async add(req: AuthRequest, res: Response) {
    try {
      const { productId, quantity } = req.body;
      const userId = req.userId!;

      if (!productId) {
        return res.status(400).json({ error: "Product ID required" });
      }

      const cartItem = await CartService.addProduct(userId, productId, quantity || 1);
      const cart = await CartService.getCart(userId);

      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async remove(req: AuthRequest, res: Response) {
    try {
      const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
      const userId = req.userId!;

      if (!itemId) {
        return res.status(400).json({ error: "Item ID required" });
      }

      await CartService.removeItem(itemId);
      const cart = await CartService.getCart(userId);

      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async get(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const cart = await CartService.getCart(userId);
      res.json(cart);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
