import { IsString, MinLength, MaxLength } from "class-validator";

export class CreateBoardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}

export class UpdateBoardDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;
}

export class BoardResponseDto {
  id!: string;
  name!: string;
  ownerId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
