import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class MoveRegisteredDto {
    @IsNotEmpty()
    @IsString()
    fromPollingUnitId: string;

    @IsNotEmpty()
    @IsString()
    toPollingUnitId: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    count: number;
}
