import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequest {
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
