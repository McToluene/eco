import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema()
export class Collection {
  @Prop()
  pollingUnit: string;

  @Prop()
  data: number;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
