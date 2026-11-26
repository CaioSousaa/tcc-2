import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
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
  listId!: string;

  @ManyToOne(() => List, (l) => l.cards, { onDelete: "CASCADE" })
  list!: List;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "int" })
  position!: number;

  @Column({ type: "timestamp", nullable: true })
  dueDate!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToMany(() => Label, (l) => l.cards)
  @JoinTable({
    name: "card_labels",
    joinColumn: { name: "cardId" },
    inverseJoinColumn: { name: "labelId" },
  })
  labels!: Label[];

  @ManyToMany(() => User)
  @JoinTable({
    name: "card_assignees",
    joinColumn: { name: "cardId" },
    inverseJoinColumn: { name: "userId" },
  })
  assignees!: User[];

  @OneToMany(() => Checklist, (c) => c.card)
  checklists!: Checklist[];

  @OneToMany(() => Comment, (c) => c.card)
  comments!: Comment[];
}
