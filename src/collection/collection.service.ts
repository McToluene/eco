import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CollectionService {
  private readonly logger = new Logger(CollectionService.name);
}
