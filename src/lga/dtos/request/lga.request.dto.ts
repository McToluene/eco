import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export default class LgaRequestDto {
  @IsString()
  @ApiProperty()
  stateId: string;

  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  code: string;
}
