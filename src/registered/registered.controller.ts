import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { RegisteredService } from './registered.service';

import { Express } from 'express';
import { BaseResponse } from '../dtos/response/base.response';
import { Registered } from './schemas/registered.schema';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../user/guards/roles.guard';
import { PollingUnitsGuard } from '../user/guards/polling-units.guard';
import { RequirePollingUnits, Roles } from '../user/decorators/roles.decorator';
import { UserType } from '../user/enum/userType.enum';
import { MoveRegisteredDto } from './dtos/request/move-registered.request.dto';
import { DuplicateRegisteredDto } from './dtos/request/duplicate-registered.request.dto';
import { SyncCountsBulkDto } from './dtos/request/sync-counts.request.dto';
import { HTTP_MESSAGES } from '../constants/messages.constants';

@Controller('registered')
@UseGuards(JwtAuthGuard, PollingUnitsGuard)
export class RegisteredController {
  constructor(private readonly registeredService: RegisteredService) { }

  @Put('/move')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async moveRegisteredVoters(
    @Body() moveDto: MoveRegisteredDto,
  ): Promise<BaseResponse<void>> {
    await this.registeredService.moveRegisteredVoters(
      moveDto.fromPollingUnitId,
      moveDto.toPollingUnitId,
      moveDto.count,
      moveDto.refIndex,
    );
    return {
      message: HTTP_MESSAGES.SUCCESS.REGISTERED_VOTERS_MOVED,
      data: null,
      status: HttpStatus.OK,
    };
  }

  @Put('/duplicate')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async duplicateRegisteredVoters(
    @Body() duplicateDto: DuplicateRegisteredDto,
  ): Promise<BaseResponse<void>> {
    await this.registeredService.duplicateRegisteredVoters(
      duplicateDto.fromPollingUnitId,
      duplicateDto.toPollingUnitId,
      duplicateDto.count,
      duplicateDto.refIndex,
    );
    return {
      message: HTTP_MESSAGES.SUCCESS.REGISTERED_VOTERS_DUPLICATED,
      data: null,
      status: HttpStatus.OK,
    };
  }

  @Put('/sync-counts/:pollingUnitId')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async syncPollingUnitCounts(
    @Param('pollingUnitId') pollingUnitId: string,
  ): Promise<BaseResponse<{ registeredCount: number; accreditedCount: number }>> {
    const result = await this.registeredService.syncPollingUnitCounts(pollingUnitId);
    return {
      message: HTTP_MESSAGES.SUCCESS.POLLING_UNIT_COUNTS_SYNCED,
      data: result,
      status: HttpStatus.OK,
    };
  }

  @Put('/sync-counts')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async syncPollingUnitCountsBulk(
    @Body() dto: SyncCountsBulkDto,
  ): Promise<BaseResponse<{ pollingUnitId: string; registeredCount: number; accreditedCount: number }[]>> {
    const results = await this.registeredService.syncPollingUnitCountsBulk(dto.pollingUnitIds);
    return {
      message: HTTP_MESSAGES.SUCCESS.POLLING_UNIT_COUNTS_SYNCED,
      data: results,
      status: HttpStatus.OK,
    };
  }

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
  @RequirePollingUnits()
  async getReisgteredList(
    @Param('pollingUnitId') pollingUnitId: string,
    @Query('withoutImage') withoutImage?: string,
  ): Promise<BaseResponse<Registered[]>> {
    const onlyWithoutImage =
      withoutImage === 'true' || withoutImage === '1' || withoutImage === 'yes';

    const registered = await this.registeredService.findRegisteredVoters(
      pollingUnitId,
      onlyWithoutImage,
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
    @Query('withoutImage') withoutImage?: string,
  ): Promise<BaseResponse<number>> {
    const onlyWithoutImage =
      withoutImage === 'true' || withoutImage === '1' || withoutImage === 'yes';

    const deletedCount = await this.registeredService.deleteRegistered(
      pollingUnitId,
      onlyWithoutImage,
    );
    return {
      message: 'Registered voters deleted successfully!',
      data: deletedCount,
      status: HttpStatus.OK,
    };
  }

  @Post('/upload/picture/:pollingUnitId')
  @UseInterceptors(
    FilesInterceptor('files', 2000, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
    }),
  )
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

  @Post('/bulk-upload/:wardId')
  @UseInterceptors(
    FilesInterceptor('files', 500, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  async bulkUploadFromFolder(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('wardId') wardId: string,
  ): Promise<BaseResponse<{ 
    success: number; 
    failed: number; 
    errors: string[];
    pollingUnits: { pollingUnitId: string; code: string; dataCount: number }[];
  }>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Please upload CSV files');
    }

    const result = await this.registeredService.bulkUploadFromFolder(
      wardId,
      files,
    );

    return {
      message: `Bulk upload completed. ${result.success} successful, ${result.failed} failed.`,
      data: result,
      status: HttpStatus.OK,
    };
  }
}
