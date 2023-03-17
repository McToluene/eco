import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import CollectionRequest from './collection.request';

export default class WardBulkRequest {
  @IsString()
  @ApiProperty()
  wardId: string;

  @ApiProperty({ type: [CollectionRequest] })
  @IsArray()
  collection: CollectionRequest[];
}
