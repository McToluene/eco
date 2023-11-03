import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { PollingUnit } from '../../ward/schemas/polling.schema';

@Schema()
export class Registered {
  _id?: string;

  @Prop()
  name: string;

  @Prop()
  refIndex: number;

  @Prop()
  id: string;

  @Prop()
  gender: string;

  @Prop()
  dob: string;

  @Prop()
  imageUrl: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PollingUnit',
    required: true,
  })
  pollingUnit: PollingUnit;
}

export type RegisteredDocument = HydratedDocument<Registered>;
export const RegisteredSchema = SchemaFactory.createForClass(Registered);
