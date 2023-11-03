import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserType } from '../enum/userType.enum';

import { State } from '../../state/schemas/state.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  userName: string;

  @Prop()
  password: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
  })
  state: State;

  @Prop({ type: String, enum: UserType, default: UserType.AGENT })
  userType: UserType;
}

export const UserSchema = SchemaFactory.createForClass(User);
