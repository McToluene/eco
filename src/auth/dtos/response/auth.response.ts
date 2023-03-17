import UserResponse from 'src/dtos/request/user.response';
import TokenResponse from './token.response';

export default class AuthResponse {
  token: TokenResponse;
  user: UserResponse;
}
