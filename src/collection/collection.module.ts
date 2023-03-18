import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionService } from './collection.service';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { CollectionController } from './collection.controller';
import { WardModule } from 'src/ward/ward.module';

@Module({
  imports: [WardModule],
  exports: [CollectionService],
  providers: [CollectionService],
  controllers: [CollectionController],
})
export class CollectionModule {}
