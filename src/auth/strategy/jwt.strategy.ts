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
    // Fetch full user details including assigned polling units
    const user = await this.userService.findOne(payload.username);

    return {
      userId: (user as any)._id,
      username: user.userName,
      userType: user.userType,
      stateId: (user.state as any)._id,
      lgaId: payload.lgaId, // Keep for backward compatibility
      assignedPollingUnits: user.assignedPollingUnits,
    };
  }
}
