import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export default class StateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  code: string;
}
