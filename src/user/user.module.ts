import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PollingUnit, PollingUnitSchema } from '../ward/schemas/polling.schema';
import { StateModule } from '../state/state.module';
import { RolesGuard } from './guards/roles.guard';
import { PollingUnitsGuard } from './guards/polling-units.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PollingUnit.name, schema: PollingUnitSchema }
    ]),
    StateModule,
  ],
  providers: [UserService, RolesGuard, PollingUnitsGuard],
  controllers: [UserController],
  exports: [UserService, RolesGuard, PollingUnitsGuard],
})
export class UserModule { }
