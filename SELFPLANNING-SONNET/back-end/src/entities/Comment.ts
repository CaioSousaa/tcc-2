import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Card } from "./Card";
import { User } from "./User";

@Entity("comments")
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  cardId!: string;

  @ManyToOne(() => Card, (c) => c.comments, { onDelete: "CASCADE" })
  card!: Card;

  @Column({ type: "uuid" })
  authorId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  author!: User;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
