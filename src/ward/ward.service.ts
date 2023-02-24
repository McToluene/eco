import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Ward, WardDocument } from './schemas/ward.schema';
import WardRequest from 'src/dtos/request/ward.request';
import { PollingUnit, PollingUnitDocument } from './schemas/polling.schema';
import WardPollingUnitRequest from 'src/dtos/request/ward.pollingunit.request';

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
    entries: WardPollingUnitRequest[],
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Saving pooling');

    for (const entry of entries) {
      for (const unit of entry.pollingUnits) {
        let pollingUnit = await this.pollingUnitModel.findOne({
          name: unit.name,
          wardName: entry.wardName,
        });

        if (!pollingUnit) {
          pollingUnit = new this.pollingUnitModel({
            name: unit.name.toLowerCase(),
            code: unit.code.toLowerCase(),
            wardName: entry.wardName,
          });
          pollingUnit = await pollingUnit.save();
        }
      }
    }

    return await this.pollingUnitModel.find();
  }

  async pollingUnitsByWardName(
    wardName: string,
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Fetching pooling unit');
    return await this.pollingUnitModel.find({
      wardName: wardName.toLowerCase(),
    });
  }

  async pollingUnitByName(name: string): Promise<PollingUnit | null> {
    this.logger.log('Fetching pooling unit');
    return await this.pollingUnitModel.findOne({
      name: name.toLowerCase(),
    });
  }

  async pollingUnitByCode(code: string): Promise<PollingUnit | null> {
    this.logger.log('Fetching pooling unit');

    return await this.pollingUnitModel.findOne({
      code: code.toLowerCase,
    });
  }
}
