import { IsNotEmpty, IsString } from 'class-validator';
import { LoginRequest } from './login.request';
import { UserType } from 'src/user/enum/userType.enum';

export default class RegisterRequest extends LoginRequest {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsNotEmpty()
  userType: UserType;

  @IsNotEmpty()
  stateId: string;
}
