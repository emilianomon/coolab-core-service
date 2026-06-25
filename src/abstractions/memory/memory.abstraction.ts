import { env } from '@self/consts';
import { UnknownException } from '@self/exceptions';
import { logging } from '@self/utils';
import { createClient, RedisClientType } from 'redis';

const keyPrefix = 'coolab' as const;
export type KeyPrefix = typeof keyPrefix;

type UserId = string;

export type MemoryKey =
  | 'memo:*'
  | `memo:user-in-platform-context:${UserId}`;

export type RedisKey = `${KeyPrefix}:${MemoryKey}`;

export abstract class Memory {
  public client: RedisClientType;
  private firstErrorAt: number | null = null;

  constructor() {
    this.client = createClient({
      database: env.REDIS_DATABASE,
      password: env.REDIS_PASSWORD || undefined,
      socket: {
        host: env.REDIS_URL,
        port: env.REDIS_PORT,
        reconnectStrategy: () => this.reconnectStrategy(),
      },
    });

    this.client.on('error', error => this.onClientError(error));
    this.client.on('ready', () => this.onClientReady());
  }

  protected async set(key: MemoryKey, value: string, ttlSeconds = 300) {
    await this.ensureConnection();
    return this.client.set(this.getKey(key), value, {
      expiration: {
        type: 'EX',
        value: ttlSeconds,
      },
    });
  }

  protected async get(key: MemoryKey) {
    await this.ensureConnection();
    return this.client.get(this.getKey(key));
  }

  protected async delete(key: MemoryKey) {
    await this.ensureConnection();
    return this.client.del(this.getKey(key));
  }

  protected async getKeys(key: MemoryKey): Promise<Array<MemoryKey>> {
    await this.ensureConnection();
    const result = await this.client.keys(this.getKey(key));
    const mapped = result.map(item => item.replace(`${keyPrefix}:`, ''));
    return mapped as Array<MemoryKey>;
  }

  private async ensureConnection() {
    if(!this.client.isOpen) {
      await this.client.connect();
    }
  }

  private getKey(key: MemoryKey): RedisKey {
    return `${keyPrefix}:${key}`;
  }

  private reconnectStrategy() {
    if(this.firstErrorAt && Date.now() - this.firstErrorAt >= 60_000) {
      return new Error('Redis reconnection timed out after 60 seconds');
    }

    return 1_000;
  }

  private onClientError(error: unknown) {
    if(!this.firstErrorAt) {
      this.firstErrorAt = Date.now();
    }

    logging().error(`Redis memory error: ${JSON.stringify(error)}`);

    if(Date.now() - this.firstErrorAt >= 60_000) {
      throw new UnknownException({
        feedback: {
          enUs: 'Redis connection error.',
          esEs: 'Error de conexión con Redis.',
          ptBr: 'Erro de conexão Redis.',
        },
        message: JSON.stringify(error),
      });
    }
  }

  private onClientReady() {
    if(this.firstErrorAt) {
      logging().info('Redis connection reestablished.');
    }

    this.firstErrorAt = null;
  }
}
