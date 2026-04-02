import Redis from 'ioredis';
import pino from 'pino';
import { config } from '../config/config.js';

const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

const redisUrl = (config.REDIS_URL || '').trim();

// Parse the REDIS_URL into explicit options (avoids ioredis URL-parsing edge cases
// with the 'default' username). Matches the format Redis Cloud dashboard recommends.
// Supports: redis://user:pass@host:port  AND  rediss://user:pass@host:port (TLS)
function parseRedisUrl(url) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username: parsed.username || 'default',
      password: decodeURIComponent(parsed.password || ''),
      tls: url.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    return null;
  }
}

const redisOpts = redisUrl ? parseRedisUrl(redisUrl) : null;

const redis = redisOpts
  ? new Redis({
      host: redisOpts.host,
      port: redisOpts.port,
      username: redisOpts.username,
      password: redisOpts.password,
      ...(redisOpts.tls ? { tls: redisOpts.tls } : {}),
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

if (redisOpts) {
  redis.on('error', (err) => {
    logger.error(`Redis Error: [${err.code || err.name}] ${err.message}`);
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });

  redis.on('ready', () => {
    logger.info('Redis is ready [OK]');
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
