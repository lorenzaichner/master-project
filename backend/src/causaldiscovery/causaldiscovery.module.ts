import { Module } from '@nestjs/common';
import { CausalDiscoveryController } from './causaldiscovery.controller';
import { CausalDiscoveryService } from './causaldiscovery.service';
import { UploadModule } from 'src/upload/upload.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    controllers: [CausalDiscoveryController],
    providers: [CausalDiscoveryService],
    imports: [UploadModule, RedisModule],
    exports: [CausalDiscoveryService],
})
export class CausalDiscoveryModule {}