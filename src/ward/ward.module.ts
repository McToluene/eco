import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WardService } from './ward.service';
import { Ward, WardSchema } from '../ward/schemas/ward.schema';
import { PollingUnit, PollingUnitSchema } from './schemas/polling.schema';
import { WardController } from './ward.controller';
import { LgaModule } from '../lga/lga.module';
import { CollectionModule } from '../collection/collection.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ward.name, schema: WardSchema },
      { name: PollingUnit.name, schema: PollingUnitSchema },
    ]),
    LgaModule,
    CollectionModule,
  ],
  providers: [WardService],
  exports: [WardService],
  controllers: [WardController],
})
export class WardModule {}
