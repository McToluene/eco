import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema()
export class Collection {
  @Prop()
  name: string;

  @Prop()
  code: string;

  @Prop()
  data: number;

  @Prop()
  voters: number;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
