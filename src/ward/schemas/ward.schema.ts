import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Lga } from 'src/lga/schemas/lga.schema';

export type WardDocument = HydratedDocument<Ward>;

@Schema()
export class Ward {
  _id: string;

  @Prop()
  name: string;

  @Prop()
  code: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lga',
    required: true,
  })
  lga: Lga;
}

export const WardSchema = SchemaFactory.createForClass(Ward);
