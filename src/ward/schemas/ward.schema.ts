import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WardDocument = HydratedDocument<Ward>;

@Schema()
export class Ward {
  @Prop()
  name: string;
}

export const WardSchema = SchemaFactory.createForClass(Ward);
