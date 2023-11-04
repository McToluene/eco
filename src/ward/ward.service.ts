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
import PollingUnitResponse from './dtos/response/pollingUnit.response';
import PollingUnitRequest from 'src/dtos/request/pollingunit.request';
import { State } from 'src/state/schemas/state.schema';
import PollingResponse from './dtos/response/polling.response';

@Injectable()
export class WardService {
  private readonly logger = new Logger(WardService.name);

  constructor(
    @InjectModel(Ward.name)
    private wardModel: Model<WardDocument>,
    @InjectModel(PollingUnit.name)
    private pollingUnitModel: Model<PollingUnitDocument>,
    @InjectModel(State.name)
    private stateModel: Model<State>,

    private readonly lgaService: LgaService,
  ) {}

  async create(entry: WardRequest): Promise<Ward | null> {
    this.logger.log('Saving ward');
    entry.name = entry.name.trim().toUpperCase();
    const lga = this.lgaService.find(entry.lgaId);
    if (!lga) throw new NotFoundException('Lga not found');

    let foundWard = await this.wardModel.findOne({
      name: entry.name.trim().toUpperCase(),
      lga: entry.lgaId,
      code: entry.code,
    });

    if (foundWard) throw new ConflictException('Lga already exist');

    foundWard = new this.wardModel({
      name: entry.name.trim().toUpperCase(),
      lga: entry.lgaId,
      code: entry.code,
    });

    foundWard = await foundWard.save();
    return foundWard;
  }

  async createList(entries: WardRequest[]): Promise<Ward[] | null> {
    this.logger.log('Saving ward');
    const ward = [];
    for await (const entry of entries) {
      entry.name = entry.name.trim().toUpperCase();
      const lga = this.lgaService.find(entry.lgaId);
      if (!lga) throw new NotFoundException('Lga not found');

      let foundWard = await this.wardModel.findOne({
        name: entry.name.trim().toUpperCase(),
        lga: entry.lgaId,
        code: entry.code,
      });

      if (foundWard) throw new ConflictException('Lga already exist');

      foundWard = new this.wardModel({
        name: entry.name.trim().toUpperCase(),
        lga: entry.lgaId,
        code: entry.code,
      });

      foundWard = await foundWard.save();
      ward.push(foundWard);
    }
    return ward;
  }

  async getWard(): Promise<Ward[]> {
    return await this.wardModel.find();
  }

  async getByLga(lgaId: string): Promise<Ward[]> {
    const lga = this.lgaService.find(lgaId);
    if (!lga) throw new NotFoundException('Lga not found');
    return await this.wardModel.find({ lga });
  }

  async getPollingUnitByState(stateId: string): Promise<PollingResponse[]> {
    const state = await this.stateModel.findOne({ _id: stateId });
    if (!state) throw new NotFoundException('State not found');

    const lga = await this.lgaService.getByState(state._id);
    if (!lga) throw new NotFoundException('Lga not found');

    const pu = [];
    for await (const lg of lga) {
      const wards = await this.wardModel.find({ lga: lg });
      if (!wards) throw new NotFoundException('Wards not found');
      for await (const ward of wards) {
        const units = await this.pollingUnitModel.find({ ward });
        for await (const unit of units) {
          pu.push({
            name: `${state.code}-${lg.code}-${ward.code}-${unit.code} ${unit.name}`,
            id: unit._id,
          });
        }
      }
    }
    return pu;
  }

  async pollingUnit(
    wardId: string,
    data: PollingUnitRequest,
  ): Promise<PollingUnit | null> {
    this.logger.log('Saving polling unit');
    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new NotFoundException('Ward not found');

    let foundUnit = await this.pollingUnitModel.findOne({
      name: data.name.trim().toUpperCase(),
      ward,
      code: data.code,
    });

    if (foundUnit)
      throw new ConflictException('Polling unit already exist in ward');

    foundUnit = new this.pollingUnitModel({
      name: data.name.trim().toUpperCase(),
      ward,
      code: data.code,
    });
    foundUnit = await foundUnit.save();
    return foundUnit;
  }

  async getPollingUnit(id: string): Promise<PollingUnit[]> {
    const ward = await this.wardModel.findOne({ _id: id });
    if (!ward) throw new NotFoundException('Ward not found');
    return await this.pollingUnitModel.find({ ward });
  }

  async createPollingUnits(
    wardId: string,
    data: PollingUnitRequest[],
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Saving polling units');
    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new NotFoundException('Ward not found');
    const notExistUnits = [];
    for await (const unit of data) {
      const foundUnit = await this.pollingUnitModel.findOne({
        name: unit.name.trim().toUpperCase(),
        ward,
        code: unit.code,
      });

      if (foundUnit)
        throw new ConflictException('Polling unit already exist in ward');

      notExistUnits.push(
        new this.pollingUnitModel({
          name: unit.name.trim().toUpperCase(),
          ward,
          code: unit.code,
        }),
      );
    }

    return await this.pollingUnitModel.insertMany(notExistUnits);
  }

  async pollingUnitsByWardName(wardId: string): Promise<PollingUnit[] | null> {
    this.logger.log('Fetching polling unit');

    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new NotFoundException('Ward not found');

    return await this.pollingUnitModel.find({
      wardName: ward.name,
    });
  }

  async pollingUnits(lgaId: string): Promise<PollingUnitResponse[] | null> {
    this.logger.log('Fetching polling unit');
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
    this.logger.log('Fetching polling unit');
    return await this.pollingUnitModel.findOne({
      name: name.toLowerCase(),
    });
  }

  async pollingUnitByCode(code: string): Promise<PollingUnit | null> {
    this.logger.log('Fetching polling unit');

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
