import { Body, Controller, HttpStatus, Post, Get } from '@nestjs/common';
import { StateService } from './state.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/dtos/response/base.response';
import { State } from './schemas/state.schema';
import StateRequestDto from './dtos/request/state.request.dto';

@Controller('state')
@ApiTags('state')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Post('/')
  @ApiBody({ type: StateRequestDto })
  async create(@Body() data: StateRequestDto): Promise<BaseResponse<State>> {
    const state = await this.stateService.create(data);
    return {
      message: 'State saved successfully!',
      data: state,
      status: HttpStatus.CREATED,
    };
  }

  @Post('/list')
  @ApiBody({ type: [StateRequestDto] })
  async createList(
    @Body() data: StateRequestDto[],
  ): Promise<BaseResponse<State[]>> {
    const states = await this.stateService.createList(data);
    return {
      message: 'State saved successfully!',
      data: states,
      status: HttpStatus.CREATED,
    };
  }

  @Get('/')
  async getData(): Promise<BaseResponse<State[]>> {
    const data = await this.stateService.get();
    return {
      message: 'State fetched successfully!',
      data: data,
      status: HttpStatus.OK,
    };
  }
}
