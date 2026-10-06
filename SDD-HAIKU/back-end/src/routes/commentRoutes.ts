import { Router } from "express";
import { CommentController } from "../controllers/CommentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });
const commentController = new CommentController();

router.use(authMiddleware);

router.get("/", (req, res) => commentController.getCommentsByCard(req, res));
router.post("/", (req, res) => commentController.createComment(req, res));
router.patch("/:commentId", (req, res) => commentController.updateComment(req, res));
router.delete("/:commentId", (req, res) => commentController.deleteComment(req, res));

export default router;
