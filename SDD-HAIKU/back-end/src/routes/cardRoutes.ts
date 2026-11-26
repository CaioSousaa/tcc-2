import { Router } from "express";
import { CardController } from "../controllers/CardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router({ mergeParams: true });
const cardController = new CardController();

router.use(authMiddleware);

router.post("/", (req, res) => cardController.createCard(req, res));
router.get("/:cardId", (req, res) => cardController.getCardById(req, res));
router.patch("/:cardId", (req, res) => cardController.updateCard(req, res));
router.delete("/:cardId", (req, res) => cardController.deleteCard(req, res));
router.patch("/:cardId/list", (req, res) => cardController.moveCard(req, res));
router.patch("/", (req, res) => cardController.reorderCards(req, res));

export default router;
