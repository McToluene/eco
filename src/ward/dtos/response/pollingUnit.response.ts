import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class PollingUnitResponse {
  @IsString()
  @ApiProperty()
  _id: string;

  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsString()
  @ApiProperty()
  wardName: string;
}
