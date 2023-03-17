import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StateDocument = HydratedDocument<State>;

@Schema()
export class State {
  @Prop()
  name: string;

  @Prop()
  code: string;
}

export const StateSchema = SchemaFactory.createForClass(State);
