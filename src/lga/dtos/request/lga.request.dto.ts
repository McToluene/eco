import { IsString } from 'class-validator';

export default class LgaRequestDto {
  @IsString()
  stateId: string;

  @IsString()
  name: string;

  @IsString()
  code: string;
}
