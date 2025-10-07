import * as bcrypt from 'bcrypt';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user/user.service';
import { User } from 'src/user/schemas/user.schema';
import AuthResponse from './dtos/response/auth.response';
import TokenResponse from './dtos/response/token.response';
import RegisterRequest from './dtos/request/register.request';
import { UserType } from 'src/user/enum/userType.enum';
import { StateService } from 'src/state/state.service';
import { UserAlreadyExistsException, StateNotFoundException } from '../exceptions/business.exceptions';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private stateStateService: StateService,
  ) { }

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
      stateId: (user.state as any)._id,
      userId: (user as any)._id,
      userType: user.userType,
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
    // Check if user already exists
    const existingUser = await this.userService.findOne(data.username);
    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    // Validate state exists
    const state = await this.stateStateService.find(data.stateId);
    if (!state) {
      throw new StateNotFoundException();
    }

    // Hash password and create user
    const hashedPassword = await this.hashPassword(data.password);
    const newUser: Partial<User> = {
      userName: data.username,
      password: hashedPassword,
      state,
      userType: UserType.AGENT,
      assignedPollingUnits: [],
      createdAt: new Date(),
    };

    return await this.userService.create(newUser as User);
  }
}
