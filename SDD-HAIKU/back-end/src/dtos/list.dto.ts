import { IsString, MinLength, MaxLength, IsUUID, IsArray } from "class-validator";

export class CreateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}

export class UpdateListDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}

export class ReorderListsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  listIds!: string[];
}
