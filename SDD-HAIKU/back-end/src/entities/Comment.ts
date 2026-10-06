import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  cardId!: string;

  @Column({ type: "uuid" })
  authorId!: string;

  @Column({ type: "text" })
  text!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: "timestamp", nullable: true })
  deletedAt!: Date | null;

  @ManyToOne(() => Card, (card) => card.comments)
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @ManyToOne(() => User)
  @JoinColumn({ name: "authorId" })
  author!: User;
}
