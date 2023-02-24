import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PollingUnitDocument = HydratedDocument<PollingUnit>;

@Schema()
export class PollingUnit {
  @Prop()
  name: string;

  @Prop()
  code: string;

  @Prop()
  wardName: string;
}

export const PollingUnitSchema = SchemaFactory.createForClass(PollingUnit);
