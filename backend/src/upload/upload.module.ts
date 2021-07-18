import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { ResultsModule } from 'src/results/results.module';

@Module({
  imports: [ResultsModule],
  exports: [UploadService],
  providers: [UploadService],
  controllers: [UploadController]
})
export class UploadModule {}
