import { UserResponse } from 'src/user/dtos/response/user-management.response';
import TokenResponse from './token.response';

export default class AuthResponse {
  token: TokenResponse;
  user: UserResponse;
}
