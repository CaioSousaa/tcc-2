import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
@Index(["cardId", "createdAt", "id"])
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "card_id", type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Relation<Card>;

  /**
   * A FK é para `users`, não para `board_members`, e sem cascata: o comentário
   * mantém a autoria mesmo que a pessoa saia do quadro (RN-24, CB-32).
   */
  @Column({ name: "author_id", type: "uuid" })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT", nullable: false })
  @JoinColumn({ name: "author_id" })
  author!: Relation<User>;

  @Column({ type: "varchar", length: 2000 })
  text!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
