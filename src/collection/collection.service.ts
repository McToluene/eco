import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import CollectionRequest from 'src/dtos/request/collection.request';
import { PollingUnitDocument } from '../ward/schemas/polling.schema';

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);

  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
  ) {}

  async collect(entry: CollectionRequest): Promise<Collection | null> {
    const saveEntry = null;
    this.logger.log('Saving entry');
    // const foundUnit = await this.pollingUnit.findById(entry.pollingUnit);
    // if (foundUnit) {
    //   const createdEntry = new this.collectionModel(entry);
    //   saveEntry = await createdEntry.save();
    // }
    return saveEntry;
  }
}
