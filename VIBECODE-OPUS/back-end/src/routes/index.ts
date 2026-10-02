import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import authRoutes from "./auth.routes";
import boardsRoutes from "./boards.routes";
import membersRoutes from "./members.routes";
import listsRoutes from "./lists.routes";
import cardsRoutes from "./cards.routes";
import labelsRoutes from "./labels.routes";
import checklistsRoutes from "./checklists.routes";
import commentsRoutes from "./comments.routes";
import searchRoutes from "./search.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);

router.use(requireAuth);
router.use("/boards", boardsRoutes);
router.use(membersRoutes);
router.use(listsRoutes);
router.use(cardsRoutes);
router.use(labelsRoutes);
router.use(checklistsRoutes);
router.use(commentsRoutes);
router.use(searchRoutes);

export default router;
