import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StateDocument = HydratedDocument<State>;

@Schema()
export class State {
  _id: string;

  @Prop()
  name: string;

  @Prop()
  code: string;
}

export const StateSchema = SchemaFactory.createForClass(State);
