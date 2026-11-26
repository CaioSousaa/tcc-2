import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { cardsRouter } from "./modules/cards/cards.routes";
import { checklistItemsRouter, checklistsRouter } from "./modules/checklists/checklists.routes";
import { labelsRouter } from "./modules/labels/labels.routes";
import { listsRouter } from "./modules/lists/lists.routes";
import { requireAuth } from "./modules/auth/auth.middleware";
import { boardsRouter } from "./modules/boards/boards.routes";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/boards", boardsRouter);
apiRouter.use("/lists", requireAuth, listsRouter);
apiRouter.use("/cards", requireAuth, cardsRouter);
apiRouter.use("/checklists", requireAuth, checklistsRouter);
apiRouter.use("/checklist-items", requireAuth, checklistItemsRouter);
apiRouter.use("/labels", requireAuth, labelsRouter);
