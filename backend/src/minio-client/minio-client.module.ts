import { Module } from '@nestjs/common';
import { MinioClientService } from './minio-client.service';

import { Logger } from 'src/log/logger';

@Module({
  providers: [MinioClientService],
  exports: [MinioClientService],
})

export class MinioClientModule {}
