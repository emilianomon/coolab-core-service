import { Memory, MemoryKey } from '@self/abstractions';
import { BadImplementationException } from '@self/exceptions';
import { autoparser } from '@self/utils';

class MemoizationMemory extends Memory {
  public async memo<TReturn>(params: {
    callback: () => Promise<TReturn>;
    key: MemoryKey;
    ttlSeconds?: number;
  }) {
    const cachedResult = await this.get(params.key);

    if(cachedResult) {
      const parsed = JSON.parse(cachedResult) as TReturn;
      return autoparser().dates(parsed);
    }

    const result = await params.callback();
    const resultSizeInBytes = Buffer.byteLength(JSON.stringify(result), 'utf8');

    if(resultSizeInBytes > 1024 * 1024 * 32) {
      throw new BadImplementationException({
        ctaType: 'support-contact',
        feedback: {
          enUs: 'Memoized function result is too large.',
          esEs: 'El resultado de la función memorizada es demasiado grande.',
          ptBr: 'Resultado da função memorizada é muito grande.',
        },
        message: 'Memoized function result is too large.',
      });
    }

    if(result !== undefined) {
      await this.set(params.key, JSON.stringify(result), params.ttlSeconds);
    }

    return result;
  }

  public purge(key: MemoryKey) {
    return this.delete(key);
  }

  public async purgeAll() {
    const keys = await this.getKeys('memo:*');
    await Promise.all(keys.map(key => this.delete(key)));
    return keys.length;
  }
}

const memory = new MemoizationMemory();

export { memory as MemoizationMemory };
