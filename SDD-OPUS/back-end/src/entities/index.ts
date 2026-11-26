import { Board } from "./Board";
import { BoardMember } from "./BoardMember";
import { Card } from "./Card";
import { CardAssignee } from "./CardAssignee";
import { CardLabel } from "./CardLabel";
import { Checklist } from "./Checklist";
import { ChecklistItem } from "./ChecklistItem";
import { Comment } from "./Comment";
import { Label } from "./Label";
import { List } from "./List";
import { Session } from "./Session";
import { User } from "./User";

/** Every entity, listed explicitly (no file glob, so it also loads under test runners). */
export const entities = [
  User,
  Session,
  Board,
  BoardMember,
  List,
  Card,
  Label,
  CardLabel,
  CardAssignee,
  Checklist,
  ChecklistItem,
  Comment,
];
