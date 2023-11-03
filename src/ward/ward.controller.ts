import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BaseResponse } from '../dtos/response/base.response';

import WardRequest from '../dtos/request/ward.request';
import { WardService } from './ward.service';
import { Ward } from './schemas/ward.schema';
import { PollingUnit } from './schemas/polling.schema';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Request } from 'express';
import CurrentUser from '../auth/dtos/request/current.user';
import PollingUnitResponse from './dtos/response/pollingUnit.response';
import PollingUnitRequest from 'src/dtos/request/pollingunit.request';

@Controller('ward')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @Post('/')
  async create(@Body() ward: WardRequest): Promise<BaseResponse<Ward>> {
    const wardData = await this.wardService.create(ward);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }

  @Post('/list')
  async createList(@Body() ward: WardRequest[]): Promise<BaseResponse<Ward[]>> {
    const wardData = await this.wardService.createList(ward);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }

  @Get('/')
  async get(): Promise<BaseResponse<string[]>> {
    const wardData = await this.wardService.getWard();
    return {
      message: 'Entry fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @Post(':id/polling-unit')
  async addPoolingUnit(
    @Body() units: PollingUnitRequest,
    @Param() id: string,
  ): Promise<BaseResponse<PollingUnit>> {
    const wardData = await this.wardService.pollingUnit(id, units);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }

  @Post(':id/polling-unit/list')
  async addPoolingUnits(
    @Body() units: PollingUnitRequest[],
    @Param() id: string,
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.createPollingUnits(id, units);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }

  @Get('/polling-unit/:wardId')
  async pollingUnitsByWardName(
    @Param('wardId') wardId: string,
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.pollingUnitsByWardName(wardId);
    return {
      message: 'Entry fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/polling-unit')
  async pollingUnits(
    @Req() req: Request,
  ): Promise<BaseResponse<PollingUnitResponse[]>> {
    const user = req.user as CurrentUser;
    const wardData = await this.wardService.pollingUnits(user.lgaId);
    return {
      message: 'Entry fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }
}
