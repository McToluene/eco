import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Duplicate voters from a source into a destination, but ONLY voters whose
 * national voter 'id' does not already exist in ANY polling unit assigned to
 * the given username. This prevents creating a duplicate voter inside that
 * user's assignment while restoring a destination's count.
 */
export class DuplicateSafeDto {
  @IsNotEmpty()
  @IsString()
  fromPollingUnitId: string;

  @IsNotEmpty()
  @IsString()
  toPollingUnitId: string;

  // The username whose assignedPollingUnits define the forbidden voter-id set.
  @IsNotEmpty()
  @IsString()
  username: string;

  // How many eligible voters to copy (ignored if voterIds is provided).
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;

  // Exact source voter _ids to copy (each must be eligible). Optional.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  voterIds?: string[];
}
