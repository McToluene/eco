import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export default class CollectionRequest {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  data: number;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty()
  voters: number;
}
