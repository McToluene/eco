import { IsNumber, IsString } from 'class-validator';

export default class PollingUnitRequest {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsNumber()
  registeredCount: number;
}
