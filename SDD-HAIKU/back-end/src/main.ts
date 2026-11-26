import "dotenv/config";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./database";
import authRoutes from "./routes/authRoutes";
import boardRoutes from "./routes/boardRoutes";
import listRoutes from "./routes/listRoutes";
import cardRoutes from "./routes/cardRoutes";
import checklistRoutes from "./routes/checklistRoutes";
import labelRoutes from "./routes/labelRoutes";
import commentRoutes from "./routes/commentRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/boards/:boardId/lists", listRoutes);
app.use("/api/lists/:listId/cards", cardRoutes);
app.use("/api/cards/:cardId/checklists", checklistRoutes);
app.use("/api/boards/:boardId/labels", labelRoutes);
app.use("/api/cards/:cardId/comments", commentRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = Number(process.env.PORT) || 3333;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
