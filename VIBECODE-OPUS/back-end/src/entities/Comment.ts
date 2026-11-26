import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, (card) => card.comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cardId" })
  card!: Relation<Card>;

  @Column({ type: "uuid" })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "authorId" })
  author!: Relation<User>;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "timestamptz", nullable: true })
  editedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
