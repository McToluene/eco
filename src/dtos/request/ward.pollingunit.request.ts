import { IsArray, IsString } from 'class-validator';
import PollingUnitRequest from './pollingunit.request';

export default class WardPollingUnitRequest {
  @IsString()
  lgaId: string;

  @IsString()
  wardName: string;

  @IsArray()
  pollingUnits: PollingUnitRequest[];
}
