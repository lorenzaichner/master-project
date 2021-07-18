import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { AppExceptionFilter } from './filters/app.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*'
  });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());

  // connect redis
  const redisService = app.get(RedisService);
  await redisService.connect();

  await app.listen(3000);
}
bootstrap();
