import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Board } from "./entities/Board";
import { List } from "./entities/List";
import { Card } from "./entities/Card";
import { Comment } from "./entities/Comment";
import { Checklist } from "./entities/Checklist";
import { ChecklistItem } from "./entities/ChecklistItem";
import { Label } from "./entities/Label";
import { CardLabel } from "./entities/CardLabel";
import { BoardMember } from "./entities/BoardMember";
import { CardMember } from "./entities/CardMember";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    User,
    Board,
    List,
    Card,
    Comment,
    Checklist,
    ChecklistItem,
    Label,
    CardLabel,
    BoardMember,
    CardMember,
  ],
  synchronize: true,
  logging: false,
});
