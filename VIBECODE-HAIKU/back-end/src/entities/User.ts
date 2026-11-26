import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Board } from "./Board";
import { BoardMember } from "./BoardMember";
import { Comment } from "./Comment";
import { CardMember } from "./CardMember";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Board, (board) => board.owner)
  ownedBoards!: Board[];

  @OneToMany(() => BoardMember, (member) => member.user)
  boardMemberships!: BoardMember[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => CardMember, (cardMember) => cardMember.user)
  cardAssignments!: CardMember[];
}
