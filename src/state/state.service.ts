import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { State, StateDocument } from './schemas/state.schema';
import { Model } from 'mongoose';
import StateRequestDto from './dtos/request/state.request.dto';

@Injectable()
export class StateService {
  private readonly logger = new Logger(StateService.name);

  constructor(
    @InjectModel(State.name) private stateModel: Model<StateDocument>,
  ) {}

  async create(state: StateRequestDto): Promise<State | null> {
    this.logger.log('Saving state');
    let foundState = await this.stateModel.findOne({
      name: state.name.toLowerCase(),
    });
    if (!foundState) {
      state.name = state.name.toLowerCase();
      foundState = new this.stateModel(state);
      foundState = await foundState.save();
    }
    return foundState;
  }

  async createList(states: StateRequestDto[]): Promise<State[] | null> {
    this.logger.log('Saving states');
    const notExistStates = [];
    for await (const state of states) {
      const foundState = await this.stateModel.findOne({
        name: state.name.toLowerCase(),
      });
      if (!foundState) {
        state.name = state.name.toLowerCase();
        notExistStates.push(new this.stateModel(state));
      }
    }

    const savedStates = await this.stateModel.insertMany(notExistStates);
    return savedStates;
  }

  async get(): Promise<State[] | null> {
    this.logger.log('Fetching states');
    return await this.stateModel.find();
  }

  async find(id: string): Promise<State | null> {
    this.logger.log('Finding state');
    return await this.stateModel.findOne({ id });
  }
}
