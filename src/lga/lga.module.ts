import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LgaService } from './lga.service';
import { Lga, LgaSchema } from './schemas/lga.schema';
import { LgaController } from './lga.controller';
import { StateModule } from 'src/state/state.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Lga.name, schema: LgaSchema }]),
    StateModule,
  ],
  providers: [LgaService],
  exports: [LgaService],
  controllers: [LgaController],
})
export class LgaModule {}
