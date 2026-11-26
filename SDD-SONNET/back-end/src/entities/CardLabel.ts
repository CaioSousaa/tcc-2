import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
export class CardLabel {
  @PrimaryColumn({ name: "card_id", type: "uuid" })
  cardId!: string;

  @PrimaryColumn({ name: "label_id", type: "uuid" })
  @Index()
  labelId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Relation<Card>;

  @ManyToOne(() => Label, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "label_id" })
  label!: Relation<Label>;
}
