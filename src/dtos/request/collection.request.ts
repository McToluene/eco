import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export default class CollectionRequest {
  @IsString()
  @ApiProperty()
  pollingUnit: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  data: number;
}
