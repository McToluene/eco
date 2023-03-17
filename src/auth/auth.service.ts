import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user/user.service';
import { User } from 'src/user/schemas/user.schema';
import AuthResponse from './dtos/response/auth.response';
import TokenResponse from './dtos/response/token.response';
import RegisterRequest from './dtos/request/register.request';
import { UserType } from 'src/user/enum/userType.enum';
import { LgaService } from 'src/lga/lga.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private lgaService: LgaService,
  ) {}

  async validateUser(userName: string, password: string): Promise<User> {
    let confirmedUser: User;
    const user = await this.userService.findOne(userName);
    if (user && (await bcrypt.compare(password, user.password)))
      confirmedUser = user;
    return confirmedUser;
  }

  login(user: User): AuthResponse {
    const payload = {
      username: user.userName,
      lgaId: user.lga.id,
    };

    const token: TokenResponse = {
      accessToken: this.jwtService.sign(payload),
      refreshToken: '',
    };

    return {
      token,
      user: {
        username: user.userName,
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

  async registerUser(data: RegisterRequest): Promise<User> {
    let user = await this.userService.findOne(data.username);
    if (user) throw new ConflictException(`User already exist!`);

    const lga = await this.lgaService.find(data.lgaId);
    if (!lga) throw new NotFoundException('Lga not found');

    data.password = await this.hashPassword(data.password);
    const newUser: User = {
      userName: data.username,
      password: data.password,
      lga: lga,
      userType: UserType.AGENT,
    };
    user = await this.userService.create(newUser);
    return user;
  }
}
