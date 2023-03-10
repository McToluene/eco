import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class PollingUnitRequest {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  code: string;
}
