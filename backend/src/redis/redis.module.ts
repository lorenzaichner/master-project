import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Module({
  imports: [],
  exports: [RedisService],
  providers: [RedisService],
  controllers: [],
})
export class RedisModule {}
