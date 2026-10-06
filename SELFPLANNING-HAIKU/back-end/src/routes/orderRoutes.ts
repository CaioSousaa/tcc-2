import { Router } from "express";
import { OrderController } from "../controllers/OrderController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/checkout", OrderController.checkout);
router.get("/:id", OrderController.getOrder);
router.get("/", OrderController.getUserOrders);

export default router;
