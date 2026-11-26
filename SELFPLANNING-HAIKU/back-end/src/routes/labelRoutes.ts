import { Router } from "express";
import { LabelController } from "../controllers/LabelController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", LabelController.create);
router.get("/board/:boardId", LabelController.getByBoard);
router.delete("/:id", LabelController.delete);

export default router;
