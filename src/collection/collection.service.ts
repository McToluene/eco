import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Collection, CollectionDocument } from './schemas/collection.schema';

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);

  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
  ) {}

  async collect(entry: any): Promise<Collection | null> {
    let saveEntry = null;
    this.logger.log('Saving entry');
    const createdEntry = new this.collectionModel(entry);
    saveEntry = await createdEntry.save();

    return saveEntry;
  }

  async get(entry: string): Promise<Collection | null> {
    this.logger.log('Saving entry');
    return await this.collectionModel
      .findOne({ name: entry.toUpperCase() })
      .populate('pollingUnit');
  }

  async find(data: any): Promise<Collection | null> {
    this.logger.log('Finding collections');
    return await this.collectionModel.findOne({ ...data });
  }
}
