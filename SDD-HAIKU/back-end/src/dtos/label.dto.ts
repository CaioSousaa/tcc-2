import { IsString, MinLength, MaxLength, Matches } from "class-validator";

export class CreateLabelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name!: string;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color!: string;
}
