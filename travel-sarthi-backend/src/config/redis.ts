import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../shared/logger';

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    enableOfflineQueue: false,
    lazyConnect: false,
    connectTimeout: 10000,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error({ err }, 'Redis connection error'));
  client.on('close', () => logger.warn('Redis connection closed'));
  client.on('reconnecting', () => logger.info('Redis reconnecting'));

  return client;
}

export const redis = createRedisClient();

// BullMQ requires separate connection instances
export function createBullMQRedisConnection(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      if (times > 20) return null;
      return Math.min(times * 200, 5000);
    },
    connectTimeout: 10000,
  });
  // Prevent unhandled error events from crashing the process
  client.on('error', () => { /* handled by BullMQ worker error event */ });
  return client;
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis connection closed');
}
