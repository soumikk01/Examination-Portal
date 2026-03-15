import Redis from 'ioredis';
import pino from 'pino';
import { config } from '../config/config.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

const redisUrl = (config.REDIS_URL || '').trim();

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis connection failed. Features requiring Redis will be bypassed.');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    })
  : {
      status: 'disabled',
      ping: () => Promise.resolve(),
    };

if (redisUrl) {
  redis.on('error', (err) => {
    logger.error('Redis Error:', err.message);
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });
}

export const cache = {
  async get(key) {
    try {
      if (redis.status !== 'ready') return null;
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 3600) {
    try {
      if (redis.status !== 'ready') return;
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      // Failed to set cache
    }
  },

  async del(key) {
    try {
      if (redis.status !== 'ready') return;
      await redis.del(key);
    } catch (err) {
      // Failed to delete cache
    }
  },
};

export default redis;
