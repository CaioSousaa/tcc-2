import { Router } from "express";
import { authMiddleware } from "./middleware/auth";
import { AuthController } from "./controllers/AuthController";
import { BoardController } from "./controllers/BoardController";
import { ListController } from "./controllers/ListController";
import { CardController } from "./controllers/CardController";
import { CommentController } from "./controllers/CommentController";
import { ChecklistController } from "./controllers/ChecklistController";
import { LabelController } from "./controllers/LabelController";
import { MemberController } from "./controllers/MemberController";

const router = Router();

// Auth routes (no auth required)
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

// Protected routes
router.get("/auth/profile", authMiddleware, AuthController.getProfile);

// Board routes
router.post("/boards", authMiddleware, BoardController.create);
router.get("/boards", authMiddleware, BoardController.list);
router.get("/boards/:id", authMiddleware, BoardController.get);
router.put("/boards/:id", authMiddleware, BoardController.update);
router.delete("/boards/:id", authMiddleware, BoardController.delete);

// List routes
router.post("/lists", authMiddleware, ListController.create);
router.put("/lists/:id", authMiddleware, ListController.update);
router.post("/lists/reorder", authMiddleware, ListController.reorder);
router.delete("/lists/:id", authMiddleware, ListController.delete);

// Card routes
router.post("/cards", authMiddleware, CardController.create);
router.get("/cards/:id", authMiddleware, CardController.get);
router.put("/cards/:id", authMiddleware, CardController.update);
router.post("/cards/:id/move", authMiddleware, CardController.move);
router.delete("/cards/:id", authMiddleware, CardController.delete);

// Comment routes
router.post("/comments", authMiddleware, CommentController.create);
router.get("/comments/:cardId", authMiddleware, CommentController.getList);
router.put("/comments/:id", authMiddleware, CommentController.update);
router.delete("/comments/:id", authMiddleware, CommentController.delete);

// Checklist routes
router.post("/checklists", authMiddleware, ChecklistController.create);
router.post("/checklists/items", authMiddleware, ChecklistController.addItem);
router.put("/checklists/items/:id/toggle", authMiddleware, ChecklistController.toggleItem);
router.put("/checklists/items/:id", authMiddleware, ChecklistController.updateItem);
router.delete("/checklists/items/:id", authMiddleware, ChecklistController.deleteItem);
router.delete("/checklists/:id", authMiddleware, ChecklistController.delete);

// Label routes
router.post("/labels", authMiddleware, LabelController.create);
router.post("/labels/card", authMiddleware, LabelController.addToCard);
router.post("/labels/card/remove", authMiddleware, LabelController.removeFromCard);
router.delete("/labels/:id", authMiddleware, LabelController.delete);

// Member routes
router.post("/members/invite", authMiddleware, MemberController.inviteBoardMember);
router.put("/members/role", authMiddleware, MemberController.updateMemberRole);
router.post("/members/remove", authMiddleware, MemberController.removeBoardMember);
router.post("/cards/assign", authMiddleware, MemberController.assignCard);
router.post("/cards/unassign", authMiddleware, MemberController.unassignCard);

export default router;
