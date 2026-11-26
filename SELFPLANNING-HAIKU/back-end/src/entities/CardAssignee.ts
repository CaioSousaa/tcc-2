import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("card_assignees")
export class CardAssignee {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Card, (card) => card.assignees, { onDelete: "CASCADE" })
  card: Card;

  @ManyToOne(() => User)
  user: User;
}
