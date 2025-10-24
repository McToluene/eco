import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: configService.get<string>('ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.userId);
    console.log('JWT Strategy - Validating user:', user);
    let stateIds = [];
    let hasStateBasedAccess = false;

    if (user.states && user.states.length > 0) {
      stateIds = user.states.map((state: any) => state._id.toString());
      hasStateBasedAccess = true;
    } else if (user.assignedPollingUnits && user.assignedPollingUnits.length > 0) {
      const stateMap = new Map();
      user.assignedPollingUnits.forEach((unit: any) => {
        const state = unit.ward?.lga?.state;
        if (state && state._id) {
          stateMap.set(state._id.toString(), state._id.toString());
        }
      });
      stateIds = Array.from(stateMap.values());
    }

    return {
      userId: (user as any)._id,
      username: user.userName,
      userType: user.userType,
      stateIds: stateIds,
      hasStateBasedAccess: hasStateBasedAccess,
      assignedPollingUnits: user.assignedPollingUnits,
    };
  }
}
