import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lga, LgaDocument } from './schemas/lga.schema';
import LgaRequestDto from './dtos/request/lga.request.dto';
import { StateService } from '../state/state.service';
import { StateDocument } from '../state/schemas/state.schema';
import { StateNotFoundException } from '../exceptions/business.exceptions';
import { StringUtils } from '../utils/common.utils';

@Injectable()
export class LgaService {
  private readonly logger = new Logger(LgaService.name);

  constructor(
    @InjectModel(Lga.name) private lgaModel: Model<LgaDocument>,
    private readonly stateService: StateService,
  ) { }

  async create(lga: LgaRequestDto): Promise<Lga | null> {
    this.logger.log('Saving lga');
    const state = this.stateService.find(lga.stateId);
    if (!state) throw new NotFoundException('state not found');

    let foundLga = await this.lgaModel.findOne({
      name: lga.name.trim().toUpperCase(),
      state: lga.stateId,
      code: lga.code,
    });

    if (foundLga) throw new ConflictException('Lga already exist in state');

    foundLga = new this.lgaModel({
      state: lga.stateId,
      name: lga.name.trim().toUpperCase(),
      code: lga.code,
    });
    foundLga = await foundLga.save();
    return foundLga;
  }

  async createList(lgas: LgaRequestDto[]): Promise<Lga[] | null> {
    this.logger.log('Saving lgas');
    const notExistLga = [];
    for await (const lga of lgas) {
      const state = await this.stateService.find(lga.stateId);
      if (state) {
        const foundLga = await this.lgaModel.findOne({
          name: lga.name.trim().toUpperCase(),
          state: lga.stateId,
          code: lga.code,
        });

        if (!foundLga) {
          lga.name = lga.name.trim().toUpperCase();
          notExistLga.push(new this.lgaModel(lga));
        }
      }
    }
    return await this.lgaModel.insertMany(notExistLga);
  }

  async get(): Promise<Lga[] | null> {
    this.logger.log('Fetching lgas');
    return await this.lgaModel.find();
  }

  async getByState(stateId: string): Promise<Lga[] | null> {
    this.logger.log('Fetching lgas');
    const state = await this.stateService.find(stateId);
    if (!state) throw new NotFoundException('State not found');

    return await this.lgaModel.find({ state });
  }

  // Looks the state up by code; the LGA is matched on state + code and created if missing.
  async findOrCreateByCode(
    stateCode: string,
    lgaCode: string,
    lgaName: string,
  ): Promise<{ state: StateDocument; lga: LgaDocument; created: boolean }> {
    const state = await this.stateService.findByCode(stateCode);
    if (!state) throw new StateNotFoundException();

    const name = StringUtils.normalizeString(lgaName);
    const code = lgaCode.trim();

    const existing = await this.lgaModel.findOne({ state: state._id, code });
    if (existing) {
      if (existing.name !== name) {
        throw new ConflictException(
          `LGA code ${code} already belongs to LGA ${existing.name} in state ${state.name}`,
        );
      }
      this.logger.log(`Using existing LGA ${existing.code} ${existing.name}`);
      return { state, lga: existing, created: false };
    }

    const lga = await new this.lgaModel({
      state: state._id,
      name,
      code,
    }).save();
    this.logger.log(
      `Created LGA ${lga.code} ${lga.name} in state ${state.name}`,
    );
    return { state, lga, created: true };
  }

  async find(id: string): Promise<Lga | null> {
    this.logger.log('Finding Lga');
    return await this.lgaModel.findById(id);
  }

  async findByIds(ids: string[]): Promise<Lga[]> {
    this.logger.log('Finding LGAs by IDs');
    return await this.lgaModel.find({ _id: { $in: ids } });
  }
}
