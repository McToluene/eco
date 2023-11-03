import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.stratrgy';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';

import { PassportModule } from '@nestjs/passport';
import { StateModule } from 'src/state/state.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_SECRET'),
        signOptions: { expiresIn: '2days' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    StateModule,
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
