import { Body, Controller, HttpStatus, Post, Get, Param } from '@nestjs/common';
import { BaseResponse } from 'src/dtos/response/base.response';
import { CollectionService } from './collection.service';
import CollectionRequest from 'src/dtos/request/collection.request';
import { ApiTags } from '@nestjs/swagger';
import { Collection } from './schemas/collection.schema';

@Controller('collection')
@ApiTags('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('/')
  async collect(
    @Body() entry: CollectionRequest[],
  ): Promise<BaseResponse<string>> {
    await this.collectionService.collect(entry);
    return {
      message: 'Entry saved successfully!',
      data: 'Entry saved successfully!',
      status: HttpStatus.CREATED,
    };
  }

  @Get('/:pollingUnit')
  async getData(
    @Param('pollingUnit') pollingUnit: string,
  ): Promise<BaseResponse<Collection>> {
    const data = await this.collectionService.get(pollingUnit);
    return {
      message: 'Entry fetched successfully!',
      data: data,
      status: HttpStatus.OK,
    };
  }
}
