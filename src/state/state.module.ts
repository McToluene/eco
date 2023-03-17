import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { State, StateSchema } from './schemas/state.schema';
import { StateService } from './state.service';
import { StateController } from './state.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: State.name, schema: StateSchema }]),
  ],
  providers: [StateService],
  exports: [StateService],
  controllers: [StateController],
})
export class StateModule {}
