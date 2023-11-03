import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WardModule } from './ward/ward.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { StateModule } from './state/state.module';
import { LgaModule } from './lga/lga.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    StateModule,
    LgaModule,
    UserModule,
    AuthModule,
    WardModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
