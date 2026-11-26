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
  type Relation,
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

  @Column({ type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Board, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board!: Relation<Board>;

  @Column({ type: "uuid" })
  listId!: string;

  @ManyToOne(() => List, (list) => list.cards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "listId" })
  list!: Relation<List>;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "int", default: 0 })
  position!: number;

  @Column({ type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @Column({ type: "boolean", default: false })
  completed!: boolean;

  @ManyToMany(() => Label, { onDelete: "CASCADE" })
  @JoinTable({
    name: "card_labels",
    joinColumn: { name: "cardId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "labelId", referencedColumnName: "id" },
  })
  labels!: Relation<Label[]>;

  @ManyToMany(() => User, { onDelete: "CASCADE" })
  @JoinTable({
    name: "card_assignees",
    joinColumn: { name: "cardId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "userId", referencedColumnName: "id" },
  })
  assignees!: Relation<User[]>;

  @OneToMany(() => Checklist, (checklist) => checklist.card)
  checklists!: Relation<Checklist[]>;

  @OneToMany(() => Comment, (comment) => comment.card)
  comments!: Relation<Comment[]>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
