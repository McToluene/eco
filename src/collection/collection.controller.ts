import { Controller, HttpStatus, Get, Param } from '@nestjs/common';
import { BaseResponse } from 'src/dtos/response/base.response';
import { CollectionService } from './collection.service';
import { ApiTags } from '@nestjs/swagger';
import { Collection } from './schemas/collection.schema';
import { WardService } from 'src/ward/ward.service';

@Controller('collection')
@ApiTags('collection')
export class CollectionController {
  constructor(private readonly wardService: WardService) {}

  // @Post('/')
  // @ApiBody({ type: [CollectionRequest] })
  // async collect(
  //   @Body() entry: CollectionRequest[],
  // ): Promise<BaseResponse<string>> {
  //   await this.collectionService.collect(entry);
  //   return {
  //     message: 'Entry saved successfully!',
  //     data: 'Entry saved successfully!',
  //     status: HttpStatus.CREATED,
  //   };
  // }

  @Get('/:pollingUnit')
  async getData(
    @Param('pollingUnit') pollingUnit: string,
  ): Promise<BaseResponse<Collection>> {
    const data = await this.wardService.getCollection(pollingUnit);
    return {
      message: 'Entry fetched successfully!',
      data: data,
      status: HttpStatus.OK,
    };
  }
}
