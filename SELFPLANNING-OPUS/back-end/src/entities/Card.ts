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
  type Relation,
} from "typeorm";
import { BoardList } from "./BoardList";
import { Checklist } from "./Checklist";
import { Comment } from "./Comment";
import { Label } from "./Label";
import { User } from "./User";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "int" })
  position!: number;

  @Column({ name: "due_date", type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @Column({ default: false })
  completed!: boolean;

  @Column({ name: "list_id" })
  listId!: string;

  @ManyToOne(() => BoardList, (list) => list.cards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "list_id" })
  list!: Relation<BoardList>;

  @OneToMany(() => Checklist, (checklist) => checklist.card)
  checklists!: Relation<Checklist[]>;

  @OneToMany(() => Comment, (comment) => comment.card)
  comments!: Relation<Comment[]>;

  @ManyToMany(() => Label, { onDelete: "CASCADE" })
  @JoinTable({
    name: "card_labels",
    joinColumn: { name: "card_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "label_id", referencedColumnName: "id" },
  })
  labels!: Relation<Label[]>;

  @ManyToMany(() => User, { onDelete: "CASCADE" })
  @JoinTable({
    name: "card_assignees",
    joinColumn: { name: "card_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "user_id", referencedColumnName: "id" },
  })
  assignees!: Relation<User[]>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
