import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { BaseResponse } from 'src/dtos/response/base.response';
import { CollectionService } from './collection.service';
import CollectionRequest from 'src/dtos/request/collection.request';
import { ApiTags } from '@nestjs/swagger';

@Controller('collection')
@ApiTags('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('/collect')
  async collect(
    @Body() entry: CollectionRequest,
  ): Promise<BaseResponse<string>> {
    await this.collectionService.collect(entry);
    return {
      message: 'Entry saved successfully!',
      data: 'Entry saved successfully!',
      status: HttpStatus.OK,
    };
  }
}
