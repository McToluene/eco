import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import PollingResponse from './dtos/response/polling.response';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Post('upload/polling-unit')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    await this.wardService.uploadPollingUnit(file);
  }

  @Post('update/upload/polling-unit')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUpdateExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    await this.wardService.uploadUpdatePollingUnit(file);
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
  async get(): Promise<BaseResponse<Ward[]>> {
    const wardData = await this.wardService.getWard();
    return {
      message: 'Ward fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @Get('/:lgaId')
  async getByLga(@Param('lgaId') lgaId: string): Promise<BaseResponse<Ward[]>> {
    const wardData = await this.wardService.getByLga(lgaId);
    return {
      message: 'Wards fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @Post(':id/polling-unit')
  async addPoolingUnit(
    @Body() units: PollingUnitRequest,
    @Param('id') id: string,
  ): Promise<BaseResponse<PollingUnit>> {
    const wardData = await this.wardService.pollingUnit(id, units);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }

  @Get(':id/polling-unit')
  async getPollingUnit(
    @Param('id') id: string,
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.getPollingUnit(id);
    return {
      message: 'Entry fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @Get('/state/:stateId/polling-unit')
  async getPollingUnitByState(
    @Param('stateId') stateId: string,
  ): Promise<BaseResponse<PollingResponse[]>> {
    const wardData = await this.wardService.getPollingUnitByState(stateId);
    return {
      message: 'Polling unit fetched successfully!',
      data: wardData,
      status: HttpStatus.OK,
    };
  }

  @Post(':id/polling-unit/list')
  async addPoolingUnits(
    @Body() units: PollingUnitRequest[],
    @Param('id') id: string,
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
