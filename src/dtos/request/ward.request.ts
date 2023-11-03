import { IsString } from 'class-validator';

export default class WardRequest {
  @IsString()
  lgaId: string;

  @IsString()
  name: string;

  @IsString()
  code: string;
}
