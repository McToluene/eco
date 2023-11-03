import { IsString } from 'class-validator';

export default class PollingUnitResponse {
  @IsString()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  wardName: string;
}
