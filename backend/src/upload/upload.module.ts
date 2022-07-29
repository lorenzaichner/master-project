import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ResultsModule } from 'src/results/results.module';
import { RedisModule } from 'src/redis/redis.module';
import { MinioClientModule } from 'src/minio-client/minio-client.module';

@Module({
  imports: [ResultsModule, RedisModule, MinioClientModule],
  exports: [UploadService],
  providers: [UploadService],
  controllers: [UploadController]
})
export class UploadModule {}
