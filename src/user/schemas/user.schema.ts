import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserType } from '../enum/userType.enum';
import { Lga } from 'src/lga/schemas/lga.schema';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  userName: string;

  @Prop()
  password: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lga',
    required: true,
  })
  lga: Lga;

  @Prop({ type: String, enum: UserType, default: UserType.AGENT })
  userType: UserType;
}

export const UserSchema = SchemaFactory.createForClass(User);
