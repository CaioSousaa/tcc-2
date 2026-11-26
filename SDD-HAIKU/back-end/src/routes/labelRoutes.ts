import { Router } from "express";
import { LabelController } from "../controllers/LabelController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });
const labelController = new LabelController();

router.use(authMiddleware);

router.get("/", (req, res) => labelController.getLabelsByBoard(req, res));
router.post("/", (req, res) => labelController.createLabel(req, res));
router.delete("/:labelId", (req, res) => labelController.deleteLabel(req, res));

export default router;
