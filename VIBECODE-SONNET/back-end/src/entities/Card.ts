import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Board } from "./Board";
import { List } from "./List";
import { Label } from "./Label";
import { User } from "./User";
import { Checklist } from "./Checklist";
import { Comment } from "./Comment";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "int", default: 0 })
  position!: number;

  @Column({ type: "uuid" })
  listId!: string;

  @ManyToOne(() => List, (list) => list.cards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listId" })
  list!: List;

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Board;

  @Column({ type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @Column({ type: "uuid", nullable: true })
  createdById!: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "createdById" })
  createdBy!: User | null;

  @ManyToMany(() => Label, (label) => label.cards)
  @JoinTable({
    name: "card_labels",
    joinColumn: { name: "cardId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "labelId", referencedColumnName: "id" },
  })
  labels!: Label[];

  @ManyToMany(() => User)
  @JoinTable({
    name: "card_assignees",
    joinColumn: { name: "cardId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "userId", referencedColumnName: "id" },
  })
  assignees!: User[];

  @OneToMany(() => Checklist, (checklist) => checklist.card)
  checklists!: Checklist[];

  @OneToMany(() => Comment, (comment) => comment.card)
  comments!: Comment[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
