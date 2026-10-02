import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

// RF08: a card can carry many labels and a label can sit on many cards.
// "Label and card belong to the same board" (RN-F1) is enforced by the labels service.
@Entity("card_labels")
export class CardLabel {
  @PrimaryColumn({ name: "card_id", type: "uuid" })
  cardId!: string;

  @Index()
  @PrimaryColumn({ name: "label_id", type: "uuid" })
  labelId!: string;

  @ManyToOne(() => Card, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "card_id" })
  card!: Card;

  @ManyToOne(() => Label, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({ name: "label_id" })
  label!: Label;
}
