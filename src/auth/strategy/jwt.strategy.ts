import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    // Fetch full user details including assigned polling units with full hierarchy
    const user = await this.userService.findById(payload.userId);

    // Get state IDs from user's states or from their assigned polling units
    let stateIds = [];
    let hasStateBasedAccess = false;

    if (user.states && user.states.length > 0) {
      stateIds = user.states.map((state: any) => state._id.toString());
      hasStateBasedAccess = true;
    } else if (user.assignedPollingUnits && user.assignedPollingUnits.length > 0) {
      // Derive state IDs from polling units
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
      hasStateBasedAccess: hasStateBasedAccess, // True if user has state-based access (all polling units in states)
      assignedPollingUnits: user.assignedPollingUnits,
    };
  }
}
