import { Router } from "express";
import { BoardController } from "../controllers/BoardController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", BoardController.create);
router.get("/", BoardController.list);
router.get("/:id", BoardController.getDetail);
router.patch("/:id", BoardController.update);
router.delete("/:id", BoardController.delete);

export default router;
