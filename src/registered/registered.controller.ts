import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RegisteredService } from './registered.service';

import { Express } from 'express';
import { BaseResponse } from '../dtos/response/base.response';
import { Registered } from './schemas/registered.schema';

@Controller('registered')
export class RegisteredController {
  constructor(private readonly registeredService: RegisteredService) {}

  @Post(':pollingUnitId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Param('pollingUnitId') pollingUnitId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    await this.registeredService.upload(pollingUnitId, file);
  }

  @Get('/:pollingUnitId')
  async createList(
    @Param('pollingUnitId') pollingUnitId: string,
  ): Promise<BaseResponse<Registered[]>> {
    const lgas = await this.registeredService.findRegisteredVoters(
      pollingUnitId,
    );
    return {
      message: 'Registered voters fetched successfully!',
      data: lgas,
      status: HttpStatus.OK,
    };
  }
}
