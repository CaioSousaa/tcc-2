import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { List } from "./List";
import { Comment } from "./Comment";
import { Checklist } from "./Checklist";
import { CardLabel } from "./CardLabel";
import { CardMember } from "./CardMember";

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  listId!: string;

  @Column({ type: "integer", default: 0 })
  position!: number;

  @Column({ type: "timestamp", nullable: true })
  dueDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => List, (list) => list.cards)
  @JoinColumn({ name: "listId" })
  list!: List;

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments!: Comment[];

  @OneToMany(() => Checklist, (checklist) => checklist.card, { cascade: true })
  checklists!: Checklist[];

  @OneToMany(() => CardLabel, (cardLabel) => cardLabel.card, { cascade: true })
  cardLabels!: CardLabel[];

  @OneToMany(() => CardMember, (cardMember) => cardMember.card, { cascade: true })
  assignees!: CardMember[];
}
