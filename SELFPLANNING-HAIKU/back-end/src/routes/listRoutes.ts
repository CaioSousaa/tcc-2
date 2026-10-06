import { Router } from "express";
import { ListController } from "../controllers/ListController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", ListController.create);
router.get("/board/:boardId", ListController.getByBoard);
router.patch("/:id", ListController.update);
router.patch("/:id/reorder", ListController.reorder);
router.delete("/:id", ListController.delete);

export default router;
