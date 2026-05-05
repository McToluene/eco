import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class DuplicateRegisteredDto {
    @IsNotEmpty()
    @IsString()
    fromPollingUnitId: string;

    @IsNotEmpty()
    @IsString()
    toPollingUnitId: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    count?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    refIndex?: number;
}
