import { Body, Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { BaseResponse } from 'src/dtos/response/base.response';

import WardRequest from 'src/dtos/request/ward.request';
import { WardService } from './ward.service';
import { Ward } from './schemas/ward.schema';
import { PollingUnit } from './schemas/polling.schema';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import WardPollingUnitRequest from 'src/dtos/request/ward.pollingunit.request';

@Controller('ward')
@ApiTags('ward')
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

  @Get('/')
  async get(): Promise<BaseResponse<string[]>> {
    const wardData = await this.wardService.getWard();
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @ApiBody({ type: [WardPollingUnitRequest] })
  @Post('/polling-unit')
  async pollingUnit(
    @Body() units: WardPollingUnitRequest[],
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.pollingUnit(units);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }

  @Get('/polling-unit/:wardName')
  async pollingUnitsByWardName(
    @Param('wardName') wardName: string,
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.pollingUnitsByWardName(wardName);
    return {
      message: 'Entry fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @Get('/polling-unit')
  async pollingUnits(): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.pollingUnits();
    return {
      message: 'Entry fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }
}
