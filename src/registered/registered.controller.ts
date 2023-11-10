import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { RegisteredService } from './registered.service';

import { Express } from 'express';
import { BaseResponse } from '../dtos/response/base.response';
import { Registered } from './schemas/registered.schema';

@Controller('registered')
export class RegisteredController {
  constructor(private readonly registeredService: RegisteredService) {}

  @Post('/:pollingUnitId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Param('pollingUnitId') pollingUnitId: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    await this.registeredService.upload(pollingUnitId, file);
  }

  @Get('/:pollingUnitId')
  async getReisgteredList(
    @Param('pollingUnitId') pollingUnitId: string,
  ): Promise<BaseResponse<Registered[]>> {
    const registered = await this.registeredService.findRegisteredVoters(
      pollingUnitId,
    );
    return {
      message: 'Registered voters fetched successfully!',
      data: registered,
      status: HttpStatus.OK,
    };
  }

  @Delete('/:pollingUnitId')
  async deleteRegisteredList(
    @Param('pollingUnitId') pollingUnitId: string,
  ): Promise<BaseResponse<void>> {
    const empty = await this.registeredService.deleteRegistered(pollingUnitId);
    return {
      message: 'Registered voters deleted successfully!',
      data: empty,
      status: HttpStatus.OK,
    };
  }

  @Post('/upload/picture/:pollingUnitId')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('pollingUnitId') pollingUnitId: string,
  ): Promise<BaseResponse<void>> {
    if (!files) throw new BadRequestException('Please add files to upload');
    const response = await this.registeredService.uploadMultipleFiles(
      files,
      pollingUnitId,
    );
    return {
      message: 'Registered voters picture uploaded fetched successfully!',
      data: response,
      status: HttpStatus.OK,
    };
  }
}
