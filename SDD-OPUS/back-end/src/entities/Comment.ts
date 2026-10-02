import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

// Comments are immutable (RN-F4): they are only ever inserted, and disappear with their card.
@Entity("comments")
@Index("idx_comments_card_created", ["cardId", "createdAt"])
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "card_id", type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  // No cascade: removing a member keeps what they wrote (RN-X6).
  @Column({ name: "author_id", type: "uuid" })
  authorId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: "author_id" })
  author!: User;

  @Column({ type: "varchar", length: 2000 })
  body!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
