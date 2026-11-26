import { IsString, MinLength, MaxLength, IsOptional, IsDateString, IsUUID, IsArray } from "class-validator";

export class CreateCardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;
}

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class MoveCardDto {
  @IsUUID()
  listId!: string;
}

export class ReorderCardsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  cardIds!: string[];
}
