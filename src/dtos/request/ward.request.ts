import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class WardRequest {
  @IsString()
  @ApiProperty()
  lgaId: string;

  @IsString()
  @ApiProperty()
  name: string;
}
