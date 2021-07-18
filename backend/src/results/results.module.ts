import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [RedisModule],
  exports: [ResultsService],
  providers: [ResultsService],
  controllers: [ResultsController]
})
export class ResultsModule {}
