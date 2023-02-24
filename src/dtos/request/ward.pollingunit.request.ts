import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import PollingUnitRequest from './pollingunit.request';

export default class WardPollingUnitRequest {
  @IsString()
  @ApiProperty()
  wardName: string;

  @ApiProperty({ type: PollingUnitRequest })
  @IsArray()
  pollingUnits: PollingUnitRequest[];
}
