import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import WardBulkRequest from './wardBulk.request';

export default class StateWardBulkRequest {
  @ApiProperty()
  @IsString()
  lgaId: string;

  @ApiProperty({ type: [WardBulkRequest] })
  @IsArray()
  wardData: WardBulkRequest[];
}
