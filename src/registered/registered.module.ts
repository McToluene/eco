import { Module } from '@nestjs/common';
import { RegisteredController } from './registered.controller';
import { RegisteredService } from './registered.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Registered, RegisteredSchema } from './schemas/registered.schema';
import { PollingUnit, PollingUnitSchema } from '../ward/schemas/polling.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Registered.name, schema: RegisteredSchema },
      { name: PollingUnit.name, schema: PollingUnitSchema },
    ]),
  ],
  controllers: [RegisteredController],
  providers: [RegisteredService],
  exports: [RegisteredService],
})
export class RegisteredModule { }
