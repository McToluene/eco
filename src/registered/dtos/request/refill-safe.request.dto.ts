import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RefillTargetDto {
  @IsNotEmpty()
  @IsString()
  pollingUnitId: string;

  // How many voters to add to this destination.
  @IsNumber()
  @Min(1)
  count: number;
}

/**
 * Batch refill: compute the forbidden voter-id set for `username` ONCE, then
 * fill many destinations from a pool of source polling units. Only voters whose
 * national 'id' is not already present in the user's assigned polling units (nor
 * already used earlier in this same request) are copied — so no duplicate voter
 * is created inside that assignment.
 */
export class RefillSafeDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RefillTargetDto)
  destinations: RefillTargetDto[];

  // Pool of source polling units to draw eligible voters from.
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  sourcePollingUnitIds: string[];

  // Optional cap on how many source voters to load/consider (safety valve).
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScan?: number;
}
