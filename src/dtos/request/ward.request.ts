import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class WardRequest {
  @IsString()
  @ApiProperty()
  name: string;
}
