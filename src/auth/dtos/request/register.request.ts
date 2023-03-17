import { IsNotEmpty } from 'class-validator';
import { LoginRequest } from './login.request';
import { ApiProperty } from '@nestjs/swagger';

export default class RegisterRequest extends LoginRequest {
  @IsNotEmpty()
  @ApiProperty()
  lgaId: string;
}
