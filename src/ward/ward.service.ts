import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Ward, WardDocument } from './schemas/ward.schema';
import WardRequest from '../dtos/request/ward.request';
import { PollingUnit, PollingUnitDocument } from './schemas/polling.schema';
import WardPollingUnitRequest from 'src/dtos/request/ward.pollingunit.request';
import { LgaService } from '../lga/lga.service';

@Injectable()
export class WardService {
  private readonly logger = new Logger(WardService.name);

  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnitDocument>,
    private readonly lgaService: LgaService,
  ) {}

  async create(entry: WardRequest): Promise<Ward | null> {
    this.logger.log('Saving ward');
    entry.name = entry.name.toLowerCase().trim();
    const lga = this.lgaService.find(entry.lgaId);
    if (!lga) throw new NotFoundException('Lga not found');

    let foundWard = await this.wardModel.findOne({
      name: entry.name,
      lga: entry.lgaId,
    });

    if (foundWard) throw new ConflictException('Lga already exist');

    foundWard = new this.wardModel({
      name: entry.name,
      lga: entry.lgaId,
    });

    foundWard = await foundWard.save();
    return foundWard;
  }

  async getWard(): Promise<string[]> {
    const units = await this.pollingUnitModel.find();
    const ward = units.map((unit) => unit.wardName);
    const uniqueWards = [...new Set(ward)];
    return uniqueWards;
  }

  async pollingUnit(
    entries: WardPollingUnitRequest[],
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Saving pooling');

    for await (const entry of entries) {
      const lga = await this.lgaService.find(entry.lgaId);
      if (lga) {
        const foundWard = await this.wardModel.findOne({
          name: entry.wardName,
          lga: entry.lgaId,
        });

        if (foundWard) {
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
      }
    }

    return await this.pollingUnitModel.find();
  }

  async pollingUnitsByWardName(
    wardName: string,
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Fetching pooling unit');
    return await this.pollingUnitModel.find({
      wardName: wardName,
    });
  }

  async pollingUnits(): Promise<PollingUnit[] | null> {
    this.logger.log('Fetching pooling unit');
    return await this.pollingUnitModel.find({});
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

  async find(id: string): Promise<Ward | null> {
    this.logger.log('Finding state');
    return await this.wardModel.findOne({ id }).populate({
      path: 'lga',
      populate: {
        path: 'state',
        model: 'State',
      },
    });
  }
}
