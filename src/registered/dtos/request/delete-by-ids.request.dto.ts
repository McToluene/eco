import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/**
 * Delete specific registered-voter records by their _id.
 * Used to remove exact duplicate rows (keeping one copy of each voter).
 */
export class DeleteByIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];

  // Optional: polling unit the rows belong to. When provided, deletion is
  // scoped to that PU and its registeredCount is decremented accordingly.
  @IsString()
  pollingUnitId?: string;
}
