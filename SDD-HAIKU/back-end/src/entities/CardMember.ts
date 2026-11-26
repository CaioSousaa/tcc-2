import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Card } from "./Card";
import { User } from "./User";

@Entity("card_members")
export class CardMember {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  cardId!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @CreateDateColumn()
  assignedAt!: Date;

  @ManyToOne(() => Card, (card) => card.members)
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;
}
