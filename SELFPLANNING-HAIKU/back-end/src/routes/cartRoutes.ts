import { Router } from "express";
import { CartController } from "../controllers/CartController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/add", CartController.add);
router.delete("/remove/:itemId", CartController.remove);
router.get("/", CartController.get);

export default router;
