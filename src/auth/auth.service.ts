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

  async login(user: User): Promise<AuthResponse> {
    let derivedStates = [];
    if (user.assignedPollingUnits && user.assignedPollingUnits.length > 0) {
      const stateMap = new Map();
      user.assignedPollingUnits.forEach((unit: any) => {
        const state = unit.ward?.lga?.state;
        if (state && state._id) {
          const stateId = state._id.toString();
          if (!stateMap.has(stateId)) {
            stateMap.set(stateId, {
              _id: state._id,
              name: state.name,
              code: state.code,
            });
          }
        }
      });
      derivedStates = Array.from(stateMap.values());
    }

    const statesToReturn = (user.assignedPollingUnits && user.assignedPollingUnits.length > 0)
      ? derivedStates
      : (user.states || []).map((state: any) => ({
        _id: state._id,
        name: state.name,
        code: state.code,
      }));

    // Get state IDs for JWT payload
    const stateIds = statesToReturn.map((state: any) => state._id);

    const payload = {
      username: user.userName,
      stateIds: stateIds,
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
        _id: (user as any)._id,
        userName: user.userName,
        userType: user.userType,
        states: statesToReturn,
        assignedPollingUnits: (user.assignedPollingUnits || []).map((unit: any) => ({
          _id: unit._id,
          name: unit.name,
          code: unit.code,
          accreditedCount: unit.accreditedCount || 0,
          registeredCount: unit.registeredCount || 0,
          ward: {
            _id: unit.ward?._id,
            name: unit.ward?.name,
            code: unit.ward?.code,
            lga: {
              _id: unit.ward?.lga?._id,
              name: unit.ward?.lga?.name,
              code: unit.ward?.lga?.code,
              state: {
                _id: unit.ward?.lga?.state?._id,
                name: unit.ward?.lga?.state?.name,
                code: unit.ward?.lga?.state?.code,
              }
            }
          }
        })),
        createdAt: user.createdAt,
        createdBy: user.createdBy ? {
          _id: (user.createdBy as any)._id,
          userName: (user.createdBy as any).userName,
        } : undefined,
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

    let states = [];
    // Validate states if provided
    if (data.stateIds && data.stateIds.length > 0) {
      // Remove duplicates
      const uniqueStateIds = [...new Set(data.stateIds)];

      states = await Promise.all(
        uniqueStateIds.map(stateId => this.stateStateService.find(stateId))
      );

      const invalidStates = states.filter(state => !state);
      if (invalidStates.length > 0) {
        throw new StateNotFoundException();
      }
    }

    // Hash password and create user
    const hashedPassword = await this.hashPassword(data.password);
    const newUser: Partial<User> = {
      userName: data.username,
      password: hashedPassword,
      states,
      userType: UserType.AGENT,
      assignedPollingUnits: [],
      createdAt: new Date(),
    };

    return await this.userService.create(newUser as User);
  }
}
