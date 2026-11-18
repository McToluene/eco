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
import { DuplicateSafeDto } from './dtos/request/duplicate-safe.request.dto';
import { DeleteByIdsDto } from './dtos/request/delete-by-ids.request.dto';
import { RefillSafeDto } from './dtos/request/refill-safe.request.dto';
import { SyncCountsBulkDto } from './dtos/request/sync-counts.request.dto';
import { UploadWithWardDto } from './dtos/request/upload-with-ward.request.dto';
import { UploadFolderDto } from './dtos/request/upload-folder.request.dto';
import { HTTP_MESSAGES } from '../constants/messages.constants';

@Controller('registered')
@UseGuards(JwtAuthGuard, PollingUnitsGuard)
export class RegisteredController {
  constructor(private readonly registeredService: RegisteredService) {}

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
      duplicateDto.allowReuse,
    );
    return {
      message: HTTP_MESSAGES.SUCCESS.REGISTERED_VOTERS_DUPLICATED,
      data: null,
      status: HttpStatus.OK,
    };
  }

  // Duplicate voters from a source into a destination, but only voters whose
  // national 'id' is not already present in ANY polling unit assigned to the
  // given username. Prevents creating duplicate voters within that assignment.
  @Put('/duplicate-safe')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async duplicateRegisteredVotersSafe(
    @Body() dto: DuplicateSafeDto,
  ): Promise<BaseResponse<{ copied: number; voterIds: string[] }>> {
    const data = await this.registeredService.duplicateRegisteredVotersSafe(
      dto.fromPollingUnitId,
      dto.toPollingUnitId,
      dto.username,
      dto.count,
      dto.voterIds,
    );
    return {
      message: HTTP_MESSAGES.SUCCESS.REGISTERED_VOTERS_DUPLICATED,
      data,
      status: HttpStatus.OK,
    };
  }

  @Put('/sync-counts/:pollingUnitId')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async syncPollingUnitCounts(
    @Param('pollingUnitId') pollingUnitId: string,
  ): Promise<
    BaseResponse<{ registeredCount: number; accreditedCount: number }>
  > {
    const result = await this.registeredService.syncPollingUnitCounts(
      pollingUnitId,
    );
    return {
      message: HTTP_MESSAGES.SUCCESS.POLLING_UNIT_COUNTS_SYNCED,
      data: result,
      status: HttpStatus.OK,
    };
  }

  @Put('/sync-counts')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async syncPollingUnitCountsBulk(@Body() dto: SyncCountsBulkDto): Promise<
    BaseResponse<
      {
        pollingUnitId: string;
        registeredCount: number;
        accreditedCount: number;
      }[]
    >
  > {
    const results = await this.registeredService.syncPollingUnitCountsBulk(
      dto.pollingUnitIds,
    );
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

  // Batch refill: compute the username's forbidden voter-id set once, then fill
  // many destinations from a pool of source polling units without creating any
  // duplicate voter inside the user's assignment.
  @Put('/refill-safe')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async refillSafe(
    @Body() dto: RefillSafeDto,
  ): Promise<
    BaseResponse<Awaited<ReturnType<RegisteredService['refillSafe']>>>
  > {
    const data = await this.registeredService.refillSafe(
      dto.username,
      dto.destinations,
      dto.sourcePollingUnitIds,
      dto.maxScan,
    );
    return {
      message: HTTP_MESSAGES.SUCCESS.REGISTERED_VOTERS_DUPLICATED,
      data,
      status: HttpStatus.OK,
    };
  }

  @Delete('/by-ids')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  async deleteRegisteredByIds(
    @Body() dto: DeleteByIdsDto,
  ): Promise<BaseResponse<{ deletedCount: number }>> {
    const data = await this.registeredService.deleteRegisteredByIds(
      dto.ids,
      dto.pollingUnitId,
    );
    return {
      message: 'Registered voters deleted successfully!',
      data,
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
  ): Promise<
    BaseResponse<{
      success: number;
      failed: number;
      errors: string[];
      pollingUnits: {
        pollingUnitId: string;
        code: string;
        dataCount: number;
      }[];
    }>
  > {
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

  // Creates the ward if needed, then one PU per file named CODE_NAME.csv.
  @Post('/bulk-upload/lga/:lgaId')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 500, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  async uploadWithWard(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('lgaId') lgaId: string,
    @Body() body: UploadWithWardDto,
  ): Promise<
    BaseResponse<Awaited<ReturnType<RegisteredService['uploadWithWard']>>>
  > {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Please upload at least one CSV or XLSX file',
      );
    }

    const result = await this.registeredService.uploadWithWard(
      lgaId,
      body.wardName,
      body.wardCode,
      files,
    );

    return {
      message: `Upload completed. ${result.summary.created} created, ${result.summary.skipped} skipped, ${result.summary.failed} failed.`,
      data: result,
      status: HttpStatus.CREATED,
    };
  }

  // Folder upload: folderCode is STATE-LGA-WARD (e.g. 14-01-02). Creates the LGA
  // and ward if needed, then one PU per file named CODE_NAME.csv.
  @Post('/bulk-upload/folder/:folderCode')
  @UseGuards(RolesGuard)
  @Roles(UserType.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 500, {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
      },
    }),
  )
  async uploadFolder(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('folderCode') folderCode: string,
    @Body() body: UploadFolderDto,
  ): Promise<
    BaseResponse<Awaited<ReturnType<RegisteredService['uploadFolder']>>>
  > {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Please upload at least one CSV or XLSX file',
      );
    }

    const result = await this.registeredService.uploadFolder(
      folderCode,
      body.lgaName,
      body.wardName,
      files,
    );

    return {
      message: `Upload completed. ${result.summary.created} created, ${result.summary.skipped} skipped, ${result.summary.failed} failed.`,
      data: result,
      status: HttpStatus.CREATED,
    };
  }
}
