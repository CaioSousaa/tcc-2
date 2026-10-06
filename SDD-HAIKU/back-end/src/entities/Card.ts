import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { List } from "./List";
import { Checklist } from "./Checklist";
import { Comment } from "./Comment";
import { CardMember } from "./CardMember";
import { CardLabel } from "./CardLabel";

@Entity("cards")
export class Card {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  listId!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "date", nullable: true })
  dueDate!: Date | null;

  @Column({ type: "integer" })
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => List, (list) => list.cards)
  @JoinColumn({ name: "listId" })
  list!: List;

  @OneToMany(() => Checklist, (checklist) => checklist.card, { cascade: true })
  checklists!: Checklist[];

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments!: Comment[];

  @OneToMany(() => CardMember, (member) => member.card, { cascade: true })
  members!: CardMember[];

  @OneToMany(() => CardLabel, (label) => label.card, { cascade: true })
  labels!: CardLabel[];
}
