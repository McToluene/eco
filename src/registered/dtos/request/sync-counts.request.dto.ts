import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class SyncCountsBulkDto {
  @IsArray()
  @IsNotEmpty()
  @IsMongoId({ each: true })
  pollingUnitIds: string[];
}
