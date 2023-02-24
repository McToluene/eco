import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';
import CollectionRequest from 'src/dtos/request/collection.request';
import { WardService } from 'src/ward/ward.service';

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);

  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
    private wardService: WardService,
  ) {}

  async collect(entry: CollectionRequest): Promise<Collection | null> {
    let saveEntry = null;
    this.logger.log('Saving entry');
    const foundUnit = await this.wardService.pollingUnitByName(entry.name);
    if (foundUnit) {
      const createdEntry = new this.collectionModel(entry);
      saveEntry = await createdEntry.save();
    }
    return saveEntry;
  }
}
