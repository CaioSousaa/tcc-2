import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Card } from "./Card";
import { Label } from "./Label";

@Entity("card_labels")
export class CardLabel {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  cardId!: string;

  @Column()
  labelId!: string;

  @ManyToOne(() => Card, (card) => card.cardLabels)
  @JoinColumn({ name: "cardId" })
  card!: Card;

  @ManyToOne(() => Label, (label) => label.cardLabels)
  @JoinColumn({ name: "labelId" })
  label!: Label;
}
