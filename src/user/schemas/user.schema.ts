import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserType } from '../enum/userType.enum';

import { State } from '../../state/schemas/state.schema';
import { PollingUnit } from '../../ward/schemas/polling.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  userName: string;

  @Prop()
  password: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'State' }],
    default: [],
  })
  states: State[];

  @Prop({ type: String, enum: UserType, default: UserType.AGENT })
  userType: UserType;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PollingUnit' }],
    default: [],
  })
  assignedPollingUnits: PollingUnit[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  createdBy: User;
}

export const UserSchema = SchemaFactory.createForClass(User);
