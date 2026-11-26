import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm";
import { List } from "./List";
import { Checklist } from "./Checklist";
import { Comment } from "./Comment";
import { CardLabel } from "./CardLabel";
import { CardAssignee } from "./CardAssignee";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "integer", default: 0 })
  position: number;

  @Column({ type: "timestamp", nullable: true })
  dueDate: Date;

  @ManyToOne(() => List, (list) => list.cards, { onDelete: "CASCADE" })
  list: List;

  @OneToMany(() => Checklist, (checklist) => checklist.card, { cascade: true })
  checklists: Checklist[];

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments: Comment[];

  @OneToMany(() => CardLabel, (label) => label.card, { cascade: true })
  labels: CardLabel[];

  @OneToMany(() => CardAssignee, (assignee) => assignee.card, { cascade: true })
  assignees: CardAssignee[];

  @CreateDateColumn()
  createdAt: Date;
}
