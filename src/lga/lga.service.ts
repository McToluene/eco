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

@Injectable()
export class LgaService {
  private readonly logger = new Logger(LgaService.name);

  constructor(
    @InjectModel(Lga.name) private lgaModel: Model<LgaDocument>,
    private readonly stateService: StateService,
  ) {}

  async create(lga: LgaRequestDto): Promise<Lga | null> {
    this.logger.log('Saving lga');
    const state = this.stateService.find(lga.stateId);
    if (!state) throw new NotFoundException('state not found');

    let foundLga = await this.lgaModel.findOne({
      name: lga.name.toLowerCase().trim(),
      state: lga.stateId,
    });

    if (foundLga) throw new ConflictException('Lga already exist in state');

    foundLga = new this.lgaModel({
      state: lga.stateId,
      name: lga.name.toLowerCase().trim(),
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
          name: lga.name.toLowerCase(),
          state: lga.stateId,
        });

        if (!foundLga) {
          lga.name = lga.name.toLowerCase();
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

  async find(id: string): Promise<Lga | null> {
    this.logger.log('Finding Lga');
    return await this.lgaModel.findById(id);
  }
}
