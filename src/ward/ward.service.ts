import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Ward, WardDocument } from './schemas/ward.schema';
import WardRequest from 'src/dtos/request/ward.request';
import PollingUnitRequest from 'src/dtos/request/pollingunit.request';
import { PollingUnit, PollingUnitDocument } from './schemas/polling.schema';

@Injectable()
export class WardService {
  private readonly logger = new Logger(WardService.name);

  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnitDocument>,
  ) {}

  async create(entry: WardRequest): Promise<Ward | null> {
    this.logger.log('Saving ward');
    let foundWard = await this.wardModel.findOne({ name: entry.name });
    if (!foundWard) {
      entry.name = entry.name.toLowerCase();
      foundWard = new this.wardModel(entry);
      foundWard = await foundWard.save();
    }
    return foundWard;
  }

  async pollingUnit(
    entries: PollingUnitRequest[],
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Saving pooling');
    entries.forEach(async (entry) => {
      let pollingUnit = await this.pollingUnitModel.findOne({
        name: entry.name.toLowerCase(),
      });

      if (!pollingUnit) {
        pollingUnit.name = entry.name.toLowerCase();
        pollingUnit = new this.pollingUnitModel(entry);
        pollingUnit = await pollingUnit.save();
      }
    });
    return await this.pollingUnitModel.find();
  }
}
