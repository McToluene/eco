import { Body, Controller, HttpStatus, Post, Get, Param } from '@nestjs/common';

import { BaseResponse } from 'src/dtos/response/base.response';
import LgaRequestDto from './dtos/request/lga.request.dto';
import { Lga } from './schemas/lga.schema';
import { LgaService } from './lga.service';

@Controller('lga')
export class LgaController {
  constructor(private readonly lgaService: LgaService) {}

  @Post('/')
  async create(@Body() data: LgaRequestDto): Promise<BaseResponse<Lga>> {
    const lga = await this.lgaService.create(data);
    return {
      message: 'Lga saved successfully!',
      data: lga,
      status: HttpStatus.CREATED,
    };
  }

  @Post('/list')
  async createList(
    @Body() data: LgaRequestDto[],
  ): Promise<BaseResponse<Lga[]>> {
    const lgas = await this.lgaService.createList(data);
    return {
      message: 'Lga saved successfully!',
      data: lgas,
      status: HttpStatus.CREATED,
    };
  }

  @Get('/')
  async getData(): Promise<BaseResponse<Lga[]>> {
    const data = await this.lgaService.get();
    return {
      message: 'Lga fetched successfully!',
      data: data,
      status: HttpStatus.OK,
    };
  }

  @Get('/:stateId')
  async getDataByState(
    @Param('stateId') stateId: string,
  ): Promise<BaseResponse<Lga[]>> {
    const data = await this.lgaService.getByState(stateId);
    return {
      message: 'Lga fetched successfully!',
      data: data,
      status: HttpStatus.OK,
    };
  }
}
