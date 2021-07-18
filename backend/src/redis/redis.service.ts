import * as Redis from 'ioredis';
import { Logger } from 'src/log/logger';

export class RedisService {
  private static instance: Redis.Redis = null;

  public async connect(): Promise<void> {
    if(RedisService.instance != null) {
      return;
    }
    try {
      RedisService.instance = new Redis({ lazyConnect: true, host: 'redis' });
      await RedisService.instance.connect();
    } catch (e) {
      Logger.getInstance().log('error', `redis failed to connect, error: ${e}`);
    }
    Logger.getInstance().log('info', 'redis connected');
  }

  public async set(key: Redis.KeyType, value: Redis.ValueType, expireSeconds?: number): Promise<void> {
    if(expireSeconds != null) {
      await RedisService.instance.set(key, value, 'EX', expireSeconds);
    } else {
      await RedisService.instance.set(key, value);
    }
  }

  public async get(key: Redis.KeyType): Promise<Redis.ValueType> {
    return RedisService.instance.get(key);
  }

  public async del(key: Redis.KeyType): Promise<void> {
    await RedisService.instance.del(key);
  }
}
