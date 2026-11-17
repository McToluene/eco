import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadWithWardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  wardName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  wardCode: string;
}
