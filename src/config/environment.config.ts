import { IsString, IsNumber, IsOptional } from 'class-validator';

export class EnvironmentVariables {
    @IsString()
    MONGODB_URI: string;

    @IsString()
    ACCESS_SECRET: string;

    @IsNumber()
    @IsOptional()
    SALT_ROUND?: number = 10;

    @IsString()
    @IsOptional()
    CORS_ORIGIN?: string = '*';

    @IsNumber()
    @IsOptional()
    PORT?: number = 3000;

    @IsString()
    @IsOptional()
    CLOUDINARY_CLOUD_NAME?: string;

    @IsString()
    @IsOptional()
    CLOUDINARY_API_KEY?: string;

    @IsString()
    @IsOptional()
    CLOUDINARY_API_SECRET?: string;
}