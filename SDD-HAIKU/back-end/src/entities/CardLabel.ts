import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
export class CardLabel {
  @PrimaryColumn("uuid")
  id: string = uuidv4();

  @Column({ type: "uuid" })
  cardId!: string;

  @Column({ type: "uuid" })
  labelId!: string;

  @ManyToOne(() => Card, (card) => card.labels)
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @ManyToOne(() => Label, (label) => label.cardLabels)
  @JoinColumn({ name: "labelId" })
  label!: Label;
}
