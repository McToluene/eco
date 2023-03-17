import * as bcrypt from 'bcrypt';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user/user.service';
import { User } from 'src/user/schemas/user.schema';
import AuthResponse from './dtos/response/auth.response';
import TokenResponse from './dtos/response/token.response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    let confirmedUser: User;
    const user = await this.userService.findOne(email);
    if (user && (await bcrypt.compare(password, user.password)))
      confirmedUser = user;
    return confirmedUser;
  }

  login(user: User): AuthResponse {
    const payload = {
      username: user.email,
      sub: user.email,
    };

    const token: TokenResponse = {
      accessToken: this.jwtService.sign(payload),
      refreshToken: '',
    };

    return {
      token,
      user: {
        email: user.email,
      },
    };
  }

  async hashPassword(password: string) {
    this.logger.log('Hashing password');
    const salt = await bcrypt.genSalt(
      +this.configService.get<number>('SALT_ROUND'),
    );
    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async registerUser(data: User): Promise<User> {
    let user = await this.userService.findOne(data.email);
    if (user) throw new ConflictException(`User already exist!`);

    data.password = await this.hashPassword(data.password);
    user = await this.userService.create(data);
    return user;
  }
}
