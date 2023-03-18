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
import { BaseResponse } from 'src/dtos/response/base.response';

import WardRequest from 'src/dtos/request/ward.request';
import { WardService } from './ward.service';
import { Ward } from './schemas/ward.schema';
import { PollingUnit } from './schemas/polling.schema';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { Request } from 'express';
import CurrentUser from 'src/auth/dtos/request/current.user';
import StateWardBulkRequest from 'src/dtos/request/state.ward.bulk.request';
import PollingUnitResponse from './dtos/response/pollingUnit.response';

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

  @ApiBody({ type: [WardRequest] })
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

  @ApiBody({ type: StateWardBulkRequest })
  @Post('/polling-unit')
  async pollingUnit(
    @Body() units: StateWardBulkRequest,
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.pollingUnit(units);
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

  @ApiBearerAuth()
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
