import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadFolderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lgaName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  wardName: string;
}
