import { IsString, IsNotEmpty, MaxLength, MinLength, IsMongoId } from 'class-validator';

export default class LgaRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  stateId: string;

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
