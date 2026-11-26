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
import { User } from "./User";
import { BoardMember } from "./BoardMember";
import { List } from "./List";
import { Label } from "./Label";

@Entity("boards")
export class Board {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "uuid" })
  ownerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @OneToMany(() => BoardMember, (member) => member.board, { cascade: true })
  members!: BoardMember[];

  @OneToMany(() => List, (list) => list.board, { cascade: true })
  lists!: List[];

  @OneToMany(() => Label, (label) => label.board, { cascade: true })
  labels!: Label[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
