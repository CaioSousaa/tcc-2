import { Router } from "express";
import { ChecklistController } from "../controllers/ChecklistController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });
const checklistController = new ChecklistController();

router.use(authMiddleware);

router.post("/", (req, res) => checklistController.createChecklist(req, res));
router.patch("/:checklistId", (req, res) => checklistController.updateChecklistTitle(req, res));
router.delete("/:checklistId", (req, res) => checklistController.deleteChecklist(req, res));
router.post("/:checklistId/items", (req, res) => checklistController.createItem(req, res));
router.patch("/items/:itemId", (req, res) => checklistController.updateItem(req, res));
router.delete("/items/:itemId", (req, res) => checklistController.deleteItem(req, res));

export default router;
