import { Router } from "express";
import { CardController } from "../controllers/CardController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

// Card CRUD
router.post("/", CardController.create);
router.get("/list/:listId", CardController.getByList);
router.get("/:id", CardController.getDetail);
router.patch("/:id", CardController.update);
router.patch("/:id/move", CardController.move);
router.delete("/:id", CardController.delete);

// Checklists
router.post("/:cardId/checklists", CardController.createChecklist);
router.post("/:cardId/checklists/:checklistId/items", CardController.addChecklistItem);
router.patch("/:cardId/checklists/:checklistId/items/:itemId/toggle", CardController.toggleChecklistItem);
router.delete("/:cardId/checklists/:checklistId/items/:itemId", CardController.deleteChecklistItem);

// Comments
router.post("/:cardId/comments", CardController.addComment);
router.get("/:cardId/comments", CardController.getComments);
router.delete("/:cardId/comments/:commentId", CardController.deleteComment);

// Labels
router.post("/:cardId/labels", CardController.addLabel);
router.delete("/:cardId/labels/:labelId", CardController.removeLabel);

// Assignees
router.post("/:cardId/assignees", CardController.assignUser);
router.delete("/:cardId/assignees/:userId", CardController.unassignUser);

export default router;
