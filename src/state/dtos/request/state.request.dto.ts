import { IsString } from 'class-validator';

export default class StateRequestDto {
  @IsString()
  name: string;

  @IsString()
  code: string;
}
