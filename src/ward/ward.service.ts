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
import { LgaService } from '../lga/lga.service';
import WardBulkRequest from 'src/dtos/request/wardBulk.request';
import { CollectionService } from 'src/collection/collection.service';

@Injectable()
export class WardService {
  private readonly logger = new Logger(WardService.name);

  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnitDocument>,

    private readonly collectionService: CollectionService,
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
  async createList(entries: WardRequest[]): Promise<Ward[] | null> {
    this.logger.log('Saving ward');
    const ward = [];
    for await (const entry of entries) {
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
      ward.push(foundWard);
    }
    return ward;
  }

  async getWard(): Promise<string[]> {
    const units = await this.pollingUnitModel.find();
    const ward = units.map((unit) => unit.wardName);
    const uniqueWards = [...new Set(ward)];
    return uniqueWards;
  }

  async pollingUnit(entries: WardBulkRequest[]): Promise<PollingUnit[] | null> {
    this.logger.log('Saving pooling');

    for await (const entry of entries) {
      const ward = await this.wardModel.findById(entry.wardId);
      if (ward) {
        this.logger.log('Ward found ' + ward.name);
        const collections = entry.collection;
        for await (const entry of collections) {
          let pollingUnit = await this.pollingUnitModel.findOne({
            name: entry.name,
            wardName: ward.name,
          });
          if (!pollingUnit) {
            pollingUnit = new this.pollingUnitModel({
              name: entry.name.toLowerCase(),
              code: entry.code.toLowerCase(),
              wardName: ward.name,
            });
            pollingUnit = await pollingUnit.save();
            if (pollingUnit) {
              const collection = await this.collectionService.find({
                pollingUnit,
              });
              if (!collection) {
                const collect = {
                  pollingUnit,
                  data: entry.data,
                  voters: entry.voters,
                };
                await this.collectionService.collect(collect);
                this.logger.log('PollingUnit saved ' + pollingUnit.name);
              }
            }
          }
        }
      }
    }

    return await this.pollingUnitModel.find();
  }

  async pollingUnitsByWardName(wardId: string): Promise<PollingUnit[] | null> {
    this.logger.log('Fetching pooling unit');

    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new NotFoundException('Ward not found');

    return await this.pollingUnitModel.find({
      wardName: ward.name,
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
