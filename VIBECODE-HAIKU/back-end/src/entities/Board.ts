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
import { User } from "./User";
import { List } from "./List";
import { Label } from "./Label";
import { BoardMember } from "./BoardMember";

@Entity("boards")
export class Board {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.ownedBoards)
  @JoinColumn({ name: "ownerId" })
  owner!: User;

  @OneToMany(() => List, (list) => list.board, { cascade: true })
  lists!: List[];

  @OneToMany(() => Label, (label) => label.board, { cascade: true })
  labels!: Label[];

  @OneToMany(() => BoardMember, (member) => member.board, { cascade: true })
  members!: BoardMember[];
}
