import { Router } from "express";
import { ListController } from "../controllers/ListController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });
const listController = new ListController();

router.use(authMiddleware);

router.post("/", (req, res) => listController.createList(req, res));
router.patch("/:listId", (req, res) => listController.updateList(req, res));
router.delete("/:listId", (req, res) => listController.deleteList(req, res));
router.patch("/", (req, res) => listController.reorderLists(req, res));

export default router;
