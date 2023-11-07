import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Ward } from './ward.schema';

export type PollingUnitDocument = HydratedDocument<PollingUnit>;

@Schema()
export class PollingUnit {
  @Prop()
  name: string;

  @Prop()
  code: string;

  @Prop()
  accreditedCount: number;

  @Prop()
  registeredCount: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ward',
    required: true,
  })
  ward: Ward;
}

export const PollingUnitSchema = SchemaFactory.createForClass(PollingUnit);
