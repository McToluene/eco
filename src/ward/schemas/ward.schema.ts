import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Lga } from 'src/lga/schemas/lga.schema';

export type WardDocument = HydratedDocument<Ward>;

@Schema()
export class Ward {
  @Prop()
  name: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lga',
    required: true,
  })
  lga: Lga;
}

export const WardSchema = SchemaFactory.createForClass(Ward);
