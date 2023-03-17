import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionService } from './collection.service';
import { Collection, CollectionSchema } from './schemas/collection.schema';
import { CollectionController } from './collection.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collection.name, schema: CollectionSchema },
    ]),
  ],
  exports: [CollectionService],
  providers: [CollectionService],
  controllers: [CollectionController],
})
export class CollectionModule {}
