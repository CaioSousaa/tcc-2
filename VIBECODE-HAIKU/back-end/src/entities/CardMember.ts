import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("card_members")
export class CardMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  cardId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  assignedAt!: Date;

  @ManyToOne(() => Card, (card) => card.assignees)
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @ManyToOne(() => User, (user) => user.cardAssignments)
  @JoinColumn({ name: "userId" })
  user!: User;
}
