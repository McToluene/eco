import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WardModule } from './ward/ward.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { StateModule } from './state/state.module';
import { LgaModule } from './lga/lga.module';
import { RegisteredModule } from './registered/registered.module';
import { DatabaseConfig } from './config/database.config';
import { EnvironmentVariables } from './config/environment.config';
import { SeederService } from './database/seeder.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: async (config: Record<string, unknown>) => {
        const validatedConfig = plainToInstance(EnvironmentVariables, config, {
          enableImplicitConversion: true,
        });
        const errors = await validate(validatedConfig, { skipMissingProperties: false });
        if (errors.length > 0) {
          throw new Error(`Config validation error: ${errors.toString()}`);
        }
        return validatedConfig;
      },
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Optimize MongoDB connection
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      }),
      inject: [ConfigService],
    }),
    StateModule,
    LgaModule,
    UserModule,
    AuthModule,
    WardModule,
    RegisteredModule,
  ],
  controllers: [],
  providers: [AppService, DatabaseConfig, SeederService],
})
export class AppModule { }
