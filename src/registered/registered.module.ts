import { Module, forwardRef } from '@nestjs/common';
import { RegisteredController } from './registered.controller';
import { RegisteredService } from './registered.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Registered, RegisteredSchema } from './schemas/registered.schema';
import { PollingUnit, PollingUnitSchema } from '../ward/schemas/polling.schema';
import { ConfigModule } from '@nestjs/config';
import { WardModule } from '../ward/ward.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Registered.name, schema: RegisteredSchema },
      { name: PollingUnit.name, schema: PollingUnitSchema },
    ]),
    forwardRef(() => WardModule),
  ],
  controllers: [RegisteredController],
  providers: [RegisteredService],
  exports: [RegisteredService],
})
export class RegisteredModule { }
