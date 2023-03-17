import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { PollingUnit } from 'src/ward/schemas/polling.schema';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema()
export class Collection {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PollingUnit',
    required: true,
  })
  pollingUnit: PollingUnit;

  @Prop()
  data: number;

  @Prop()
  voters: number;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);
