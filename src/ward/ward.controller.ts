import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { BaseResponse } from 'src/dtos/response/base.response';

import WardRequest from 'src/dtos/request/ward.request';
import { WardService } from './ward.service';
import { Ward } from './schemas/ward.schema';
import PollingUnitRequest from 'src/dtos/request/pollingunit.request';
import { PollingUnit } from './schemas/polling.schema';
import { ApiBody, ApiTags } from '@nestjs/swagger';

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

  @ApiBody({ type: [PollingUnitRequest] })
  @Post('/polling-unit')
  async pollingUnit(
    @Body() units: PollingUnitRequest[],
  ): Promise<BaseResponse<PollingUnit[]>> {
    const wardData = await this.wardService.pollingUnit(units);
    return {
      message: 'Entry saved successfully!',
      data: wardData,
      status: HttpStatus.CREATED,
    };
  }
}
