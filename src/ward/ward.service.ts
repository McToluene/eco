import { Injectable, Logger } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Ward, WardDocument } from './schemas/ward.schema';
import WardRequest from '../dtos/request/ward.request';
import { PollingUnit, PollingUnitDocument } from './schemas/polling.schema';
import { LgaService } from '../lga/lga.service';
import PollingUnitResponse from './dtos/response/pollingUnit.response';
import PollingUnitRequest from 'src/dtos/request/pollingunit.request';
import { State } from 'src/state/schemas/state.schema';
import PollingResponse from './dtos/response/polling.response';
import { PollingUnitHelper } from './helpers/polling-unit.helper';
import {
  LgaNotFoundException,
  WardAlreadyExistsException,
  WardNotFoundException,
  PollingUnitAlreadyExistsException
} from '../exceptions/business.exceptions';
import { StringUtils, MathUtils } from '../utils/common.utils';
import { RegisteredService } from '../registered/registered.service';

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
    private readonly registeredService: RegisteredService,
  ) { }

  async create(entry: WardRequest): Promise<Ward | null> {
    this.logger.log('Saving ward');
    entry.name = StringUtils.normalizeString(entry.name);
    const lga = this.lgaService.find(entry.lgaId);
    if (!lga) throw new LgaNotFoundException();

    let foundWard = await this.wardModel.findOne({
      name: entry.name,
      lga: entry.lgaId,
      code: entry.code,
    });

    if (foundWard) throw new WardAlreadyExistsException();

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

    // Validate all LGAs first in a single query
    const lgaIds = [...new Set(entries.map(entry => entry.lgaId))];
    const existingLgas = await this.lgaService.findByIds(lgaIds);

    if (existingLgas.length !== lgaIds.length) {
      throw new LgaNotFoundException();
    }

    // Check for existing wards in bulk
    const wardQueries = entries.map(entry => ({
      name: entry.name.trim().toUpperCase(),
      lga: entry.lgaId,
      code: entry.code,
    }));

    const existingWards = await this.wardModel.find({
      $or: wardQueries
    });

    if (existingWards.length > 0) {
      throw new WardAlreadyExistsException();
    }

    // Prepare data for bulk insert
    const wardsToCreate = entries.map(entry => ({
      name: entry.name.trim().toUpperCase(),
      lga: entry.lgaId,
      code: entry.code,
    }));

    // Use insertMany for better performance
    return await this.wardModel.insertMany(wardsToCreate);
  }

  async getWard(): Promise<Ward[]> {
    return await this.wardModel.find().sort({ code: 1 });
  }

  async getByLga(lgaId: string): Promise<Ward[]> {
    const lga = await this.lgaService.find(lgaId);
    if (!lga) throw new LgaNotFoundException();
    return await this.wardModel.find({ lga }).sort({ code: 1 });
  }

  async getPollingUnitByState(stateId: string): Promise<PollingResponse[]> {
    const stateObjectId = new mongoose.Types.ObjectId(stateId);
    const pipeline = [
      {
        $lookup: {
          from: 'wards',
          localField: 'ward',
          foreignField: '_id',
          as: 'ward',
        },
      },
      {
        $unwind: '$ward',
      },
      {
        $lookup: {
          from: 'lgas',
          localField: 'ward.lga',
          foreignField: '_id',
          as: 'ward.lga',
        },
      },
      {
        $unwind: '$ward.lga',
      },
      {
        $lookup: {
          from: 'states',
          localField: 'ward.lga.state',
          foreignField: '_id',
          as: 'ward.lga.state',
        },
      },
      {
        $unwind: '$ward.lga.state',
      },
      {
        $match: {
          'ward.lga.state._id': stateObjectId,
        },
      },
      {
        $project: {
          _id: 1,
          accreditedCount: 1,
          registeredCount: 1,
          name: {
            $concat: [
              '$ward.lga.state.code',
              '-',
              '$ward.lga.code',
              '-',
              '$ward.code',
              '-',
              '$code',
              ' ',
              '$name',
            ],
          },
        },
      },
    ];

    return await this.pollingUnitModel.aggregate(pipeline).exec();
  }

  async pollingUnit(
    wardId: string,
    data: PollingUnitRequest,
  ): Promise<PollingUnit | null> {
    this.logger.log('Saving polling unit');
    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new WardNotFoundException();

    let foundUnit = await this.pollingUnitModel.findOne({
      ward,
      code: data.code,
    });

    if (foundUnit)
      throw new PollingUnitAlreadyExistsException();

    foundUnit = new this.pollingUnitModel({
      ward,
      code: data.code,
      name: data.name.trim().toUpperCase(),
      registeredCount: data.registeredCount,
      accreditedCount: data.accreditedCount,
    });
    foundUnit = await foundUnit.save();
    return foundUnit;
  }

  async getPollingUnit(id: string): Promise<PollingUnit[]> {
    const ward = await this.wardModel.findOne({ _id: id });
    if (!ward) throw new WardNotFoundException();
    return await this.pollingUnitModel.find({ ward });
  }

  async getPollingUnitById(pollingUnitId: string): Promise<PollingUnit | null> {
    this.logger.log('Fetching polling unit by ID with full details');
    const pollingUnit = await this.pollingUnitModel.findById(pollingUnitId)
      .populate({
        path: 'ward',
        populate: {
          path: 'lga',
          populate: {
            path: 'state',
            model: 'State'
          }
        }
      });

    return pollingUnit;
  }

  async getRegisteredVotersCount(pollingUnitId: string): Promise<number> {
    this.logger.log('Getting registered voters count for polling unit');
    return await this.registeredService.countRegisteredVotersByPollingUnit(pollingUnitId);
  }

  async createPollingUnits(
    wardId: string,
    data: PollingUnitRequest[],
  ): Promise<PollingUnit[] | null> {
    this.logger.log('Saving polling units');
    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new WardNotFoundException();
    const notExistUnits = [];
    for await (const unit of data) {
      const foundUnit = await this.pollingUnitModel.findOne({
        ward,
        code: unit.code,
      });

      if (foundUnit)
        throw new PollingUnitAlreadyExistsException();

      notExistUnits.push(
        new this.pollingUnitModel({
          name: unit.name.trim().toUpperCase(),
          ward,
          code: unit.code,
          registeredCount: unit.registeredCount,
          accreditedCount: unit.accreditedCount,
        }),
      );
    }

    return await this.pollingUnitModel.insertMany(notExistUnits);
  }

  async pollingUnitsByWardName(wardId: string): Promise<PollingUnit[] | null> {
    this.logger.log('Fetching polling unit');

    const ward = await this.wardModel.findById(wardId);
    if (!ward) throw new WardNotFoundException();

    return await this.pollingUnitModel.find({
      wardName: ward.name,
    });
  }

  async pollingUnits(lgaId: string): Promise<PollingUnitResponse[] | null> {
    this.logger.log('Fetching polling unit');
    const lga = await this.lgaService.find(lgaId);
    if (!lga) throw new LgaNotFoundException();
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

  async uploadPollingUnit(file: Express.Multer.File) {
    const data = PollingUnitHelper.processFile(file);

    for (const d of data) {
      const ward = await this.wardModel.findOne({
        name: d['Registration Area'],
      });
      if (ward) {
        const puCode = StringUtils.parsePollingUnitCode(d['Delimitation']);
        let foundUnit = await this.pollingUnitModel.findOne({
          ward,
          code: puCode,
        });
        if (!foundUnit) {
          const accreditedCount = MathUtils.calculateAccreditedCount(
            d['Percentage of Collected PVCs to Registered Voters'],
            d['No of Collected PVCs'],
          );

          const registeredCount = d['No of Registered Voters'];
          foundUnit = new this.pollingUnitModel({
            ward,
            code: puCode,
            name: d['Polling Unit'],
            accreditedCount,
            registeredCount,
          });
          foundUnit = await foundUnit.save();
        }
      }
    }
  }

  async uploadUpdatePollingUnit(file: Express.Multer.File) {
    const data = PollingUnitHelper.processFile(file);

    for (const d of data) {
      const ward = await this.wardModel.findOne({
        name: d['Registration Area'],
      });

      if (ward) {
        const puCode = StringUtils.parsePollingUnitCode(d['Delimitation']);
        let foundUnit = await this.pollingUnitModel.findOne({
          ward,
          code: puCode,
        });
        if (foundUnit) {
          const accreditedCount = MathUtils.calculateAccreditedCount(
            90,
            d['No of Collected PVCs'],
          );
          await this.pollingUnitModel.findOneAndUpdate(
            { code: puCode },
            { accreditedCount },
          );

          foundUnit = await foundUnit.save();
        }
      }
    }
  }
}
