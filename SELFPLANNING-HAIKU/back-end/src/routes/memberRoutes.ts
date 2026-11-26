import { Router } from "express";
import { BoardMemberController } from "../controllers/BoardMemberController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.post("/", BoardMemberController.addMember);
router.get("/board/:boardId", BoardMemberController.getMembers);
router.patch("/:id", BoardMemberController.updateRole);
router.delete("/:id", BoardMemberController.removeMember);

export default router;
