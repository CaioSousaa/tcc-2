import { Router } from "express";
import { requireAuth } from "./auth/auth.middleware";
import { assigneesRouter } from "./assignees/assignees.routes";
import { authRouter } from "./auth/auth.routes";
import { boardsRouter } from "./boards/boards.routes";
import { cardsRouter } from "./cards/cards.routes";
import { checklistsRouter } from "./checklists/checklists.routes";
import { commentsRouter } from "./comments/comments.routes";
import { healthRouter } from "./health/health.routes";
import { labelsRouter } from "./labels/labels.routes";
import { listsRouter } from "./lists/lists.routes";
import { membersRouter } from "./members/members.routes";

/** All API routers, mounted under /api by app.ts. */
export const apiRouter = Router();

// Public: health check and authentication.
apiRouter.use(healthRouter);
apiRouter.use(authRouter);

// Everything below requires a valid session (R-18).
const protectedRouter = Router();
protectedRouter.use(requireAuth);
protectedRouter.use(boardsRouter);
protectedRouter.use(membersRouter);
protectedRouter.use(listsRouter);
protectedRouter.use(cardsRouter);
protectedRouter.use(checklistsRouter);
protectedRouter.use(labelsRouter);
protectedRouter.use(assigneesRouter);
protectedRouter.use(commentsRouter);
apiRouter.use(protectedRouter);
