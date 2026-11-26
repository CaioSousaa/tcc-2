import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from "typeorm";
import { BoardMember } from "./BoardMember";
import { Card } from "./Card";

/**
 * A FK composta (`board_id`, `user_id`) → `board_members` garante no banco que só
 * membros do quadro são responsáveis (RN-23) e que remover o membro remove as
 * atribuições dele (RN-24, RT-25).
 */
@Entity("card_assignees")
export class CardAssignee {
  @PrimaryColumn({ name: "card_id", type: "uuid" })
  cardId!: string;

  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ name: "board_id", type: "uuid" })
  boardId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Relation<Card>;

  @ManyToOne(() => BoardMember, { onDelete: "CASCADE", nullable: false })
  @JoinColumn([
    { name: "board_id", referencedColumnName: "boardId" },
    { name: "user_id", referencedColumnName: "userId" },
  ])
  member!: Relation<BoardMember>;
}
