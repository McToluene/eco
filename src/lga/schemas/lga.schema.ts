import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { State } from 'src/state/schemas/state.schema';

export type LgaDocument = HydratedDocument<Lga>;

@Schema()
export class Lga {
  @Prop()
  name: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'State',
    required: true,
  })
  state: State;
}

export const LgaSchema = SchemaFactory.createForClass(Lga);
