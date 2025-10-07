import { IsString, IsNotEmpty, IsArray, IsOptional, IsEnum, IsMongoId, MinLength, MaxLength } from 'class-validator';
import { UserType } from '../../enum/userType.enum';

export class CreateUserRequest {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(50)
    userName: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    stateId: string;

    @IsEnum(UserType)
    @IsOptional()
    userType: UserType = UserType.AGENT;

    @IsArray()
    @IsOptional()
    @IsMongoId({ each: true })
    assignedPollingUnits?: string[];
}

export class AssignPollingUnitsRequest {
    @IsArray()
    @IsNotEmpty()
    @IsMongoId({ each: true })
    pollingUnitIds: string[];
}

export class UpdateUserRequest {
    @IsString()
    @IsOptional()
    @MinLength(3)
    @MaxLength(50)
    userName?: string;

    @IsString()
    @IsOptional()
    @MinLength(6)
    password?: string;

    @IsEnum(UserType)
    @IsOptional()
    userType?: UserType;

    @IsArray()
    @IsOptional()
    @IsMongoId({ each: true })
    assignedPollingUnits?: string[];
}