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

import StateWardBulkRequest from 'src/dtos/request/state.ward.bulk.request';
import PollingUnitResponse from './dtos/response/pollingUnit.response';
import {
  CollectionDocument,
  Collection,
} from 'src/collection/schemas/collection.schema';

@Injectable()
export class WardService {
  private readonly logger = new Logger(WardService.name);

  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnitDocument>,

    private readonly lgaService: LgaService,
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

  async getCollection(entry: string): Promise<Collection | null> {
    this.logger.log('Fetching entry');
    const pu = await this.pollingUnitModel.findOne({ name: entry });
    return await this.collectionModel
      .findOne({ pollingUnit: pu })
      .populate('pollingUnit');
  }

  async findCollection(data: any): Promise<Collection | null> {
    this.logger.log('Finding collections');
    return await this.collectionModel.findOne({ ...data });
  }

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
    // const ward = units.map((unit) => unit.wardName);
    // const uniqueWards = [...new Set(ward)];
    return units.map((m) => m.name);
  }

  async pollingUnit(data: StateWardBulkRequest): Promise<PollingUnit[] | null> {
    this.logger.log('Saving pooling');

    const lga = await this.lgaService.find(data.lgaId);
    if (!lga) throw new NotFoundException('Lga not found');

    for await (const entry of data.wardData) {
      let ward = await this.wardModel.findOne({
        name: entry.wardName,
        lga: data.lgaId,
      });

      if (!ward) {
        ward = new this.wardModel({
          name: entry.wardName,
          lga: data.lgaId,
        });

        ward = await ward.save();
      }

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
              ward: ward,
            });
            pollingUnit = await pollingUnit.save();
            if (pollingUnit) {
              const collection = await this.findCollection({
                pollingUnit,
              });
              if (!collection) {
                const collect = {
                  pollingUnit,
                  data: entry.data,
                  voters: entry.voters,
                };
                await this.collect(collect);
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

  async pollingUnits(lgaId: string): Promise<PollingUnitResponse[] | null> {
    this.logger.log('Fetching pooling unit');
    const lga = await this.lgaService.find(lgaId);
    if (!lga) throw new NotFoundException('Lga not found');
    const wards = await this.wardModel.find({ lga: lga });

    const pollingUnits = await this.pollingUnitModel
      .where('ward')
      .in(wards)
      .populate('ward');

    return pollingUnits.map((p) => ({
      name: p.name,
      code: p.code,
      _id: p.id,
      wardName: p.ward.name,
    }));
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
