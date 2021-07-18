import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { UploadController } from './upload/upload.controller';
import { ResultsModule } from './results/results.module';
import { SessionModule } from './session/session.module';
import { SessionGuard } from './guards/session.guard';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [UploadModule, ResultsModule, SessionModule, RedisModule],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: SessionGuard,
  }],
})
export class AppModule {}
