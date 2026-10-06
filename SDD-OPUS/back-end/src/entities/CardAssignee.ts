import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

// "Only board members" (RN-R1) and the cleanup when a member leaves (RN-X6) are enforced by
// the assignees and members services, in the same transaction.
@Entity("card_assignees")
export class CardAssignee {
  @PrimaryColumn({ name: "card_id", type: "uuid" })
  cardId!: string;

  @Index()
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @ManyToOne(() => User, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;
}
