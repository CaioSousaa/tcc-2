import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Card, (card) => card.labels, { onDelete: "CASCADE" })
  card: Card;

  @ManyToOne(() => Label, (label) => label.cardLabels, { onDelete: "CASCADE" })
  label: Label;
}
