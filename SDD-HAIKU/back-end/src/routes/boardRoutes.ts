import { Router } from "express";
import { BoardController } from "../controllers/BoardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();
const boardController = new BoardController();

router.use(authMiddleware);

router.post("/", (req, res) => boardController.createBoard(req, res));
router.get("/", (req, res) => boardController.listBoards(req, res));
router.get("/:boardId", (req, res) => boardController.getBoardById(req, res));
router.patch("/:boardId", (req, res) => boardController.updateBoard(req, res));
router.delete("/:boardId", (req, res) => boardController.deleteBoard(req, res));

export default router;
