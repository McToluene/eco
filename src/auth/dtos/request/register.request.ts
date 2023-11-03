import { IsNotEmpty } from 'class-validator';
import { LoginRequest } from './login.request';

export default class RegisterRequest extends LoginRequest {
  @IsNotEmpty()
  stateId: string;
}
