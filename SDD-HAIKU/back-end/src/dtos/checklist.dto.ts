import { IsString, MinLength, MaxLength, IsBoolean, IsOptional } from "class-validator";

export class CreateChecklistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;
}

export class CreateChecklistItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  text!: string;
}

export class UpdateChecklistItemDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
