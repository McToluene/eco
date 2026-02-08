import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WardService } from './ward.service';
import { Ward, WardSchema } from '../ward/schemas/ward.schema';
import { PollingUnit, PollingUnitSchema } from './schemas/polling.schema';
import { WardController } from './ward.controller';
import { LgaModule } from '../lga/lga.module';
import { State, StateSchema } from 'src/state/schemas/state.schema';
import { RegisteredModule } from '../registered/registered.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ward.name, schema: WardSchema },
      { name: State.name, schema: StateSchema },
      { name: PollingUnit.name, schema: PollingUnitSchema },
    ]),
    LgaModule,
    forwardRef(() => RegisteredModule),
  ],
  providers: [WardService],
  exports: [WardService],
  controllers: [WardController],
})
export class WardModule { }
