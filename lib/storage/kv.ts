import { Redis } from "@upstash/redis";

interface MemoryStore {
  data: Map<string, string>;
  ttls: Map<string, number>;
}

declare global {
  var __memoryStore: MemoryStore | undefined;
}

if (!globalThis.__memoryStore) {
  globalThis.__memoryStore = {
    data: new Map<string, string>(),
    ttls: new Map<string, number>()
  };
}

const memory = globalThis.__memoryStore;

const hasUpstashConfig = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const redisClient = hasUpstashConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null;

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    if (redisClient) {
      return await redisClient.get<T>(key);
    }
    const expiry = memory.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      memory.data.delete(key);
      memory.ttls.delete(key);
      return null;
    }
    const val = memory.data.get(key);
    if (!val) return null;
    try {
      return JSON.parse(val) as T;
    } catch {
      return val as unknown as T;
    }
  },

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    if (redisClient) {
      if (options?.ex) {
        await redisClient.set(key, value, { ex: options.ex });
      } else {
        await redisClient.set(key, value);
      }
      return;
    }
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    memory.data.set(key, serialized);
    if (options?.ex) {
      memory.ttls.set(key, Date.now() + options.ex * 1000);
    } else {
      memory.ttls.delete(key);
    }
  },

  async del(key: string): Promise<void> {
    if (redisClient) {
      await redisClient.del(key);
      return;
    }
    memory.data.delete(key);
    memory.ttls.delete(key);
  },

  async incr(key: string): Promise<number> {
    if (redisClient) {
      return await redisClient.incr(key);
    }
    const current = Number(memory.data.get(key) || 0);
    const next = current + 1;
    memory.data.set(key, String(next));
    return next;
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (redisClient) {
      await redisClient.expire(key, seconds);
      return;
    }
    memory.ttls.set(key, Date.now() + seconds * 1000);
  },

  async keys(pattern: string): Promise<string[]> {
    if (redisClient) {
      return await redisClient.keys(pattern);
    }
    const now = Date.now();
    const result: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    Array.from(memory.ttls.entries()).forEach(([k, expiry]) => {
      if (expiry && now > expiry) {
        memory.data.delete(k);
        memory.ttls.delete(k);
      }
    });
    Array.from(memory.data.keys()).forEach((k) => {
      if (regex.test(k)) {
        result.push(k);
      }
    });
    return result;
  }
};
