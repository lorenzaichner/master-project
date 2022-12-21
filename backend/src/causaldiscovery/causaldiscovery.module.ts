import { Module } from '@nestjs/common';
import { CausalDiscoveryController } from './causaldiscovery.controller';
import { CausalDiscoveryService } from './causaldiscovery.service';
import { UploadModule } from 'src/upload/upload.module';
import { RedisModule } from 'src/redis/redis.module';
import { MinioClientModule } from 'src/minio-client/minio-client.module';

@Module({
    controllers: [CausalDiscoveryController],
    providers: [CausalDiscoveryService],
    imports: [UploadModule, RedisModule, MinioClientModule],
    exports: [CausalDiscoveryService],
})
export class CausalDiscoveryModule {}