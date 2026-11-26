import "dotenv/config";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { AppDataSource } from "./database";
import { errorHandler } from "./middlewares/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { boardsRouter } from "./modules/boards/boards.routes";
import { cardsRouter } from "./modules/cards/cards.routes";
import { checklistsRouter } from "./modules/checklists/checklists.routes";
import { commentsRouter } from "./modules/comments/comments.routes";
import { labelsRouter } from "./modules/labels/labels.routes";
import { listsRouter } from "./modules/lists/lists.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/boards", boardsRouter);
app.use(listsRouter);
app.use(cardsRouter);
app.use(checklistsRouter);
app.use(labelsRouter);
app.use(commentsRouter);

app.use(errorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
