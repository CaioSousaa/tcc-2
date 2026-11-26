import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { BoardMember } from "./BoardMember";
import { List } from "./List";
import { Label } from "./Label";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 20, default: "navy" })
  color!: string;

  /**
   * List deletion rule (RF05). When true, lists that still contain cards
   * cannot be deleted; otherwise whoever deletes the list chooses between
   * moving the cards to another list or deleting them.
   */
  @Column({ type: "boolean", default: false })
  blockListDeletionWithCards!: boolean;

  @Column({ type: "uuid" })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ownerId" })
  owner!: Relation<User>;

  @OneToMany(() => BoardMember, (member) => member.board)
  members!: Relation<BoardMember[]>;

  @OneToMany(() => List, (list) => list.board)
  lists!: Relation<List[]>;

  @OneToMany(() => Label, (label) => label.board)
  labels!: Relation<Label[]>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
