import { AsyncLocalStorage } from 'node:async_hooks';

import { UnknownException } from '@self/exceptions';
import { LoggingUtil, RandomizeUtil } from '@self/utils';

export type ContextManager<TProperties> = {
  properties: TProperties;
  start: Date;
  traceId: string;
};

export type InitParams<TProperties> = {
  properties: TProperties;
  traceId?: string;
};

export abstract class Context<TProperties> {
  protected manager: AsyncLocalStorage<ContextManager<TProperties>>;

  constructor() {
    this.manager = new AsyncLocalStorage<ContextManager<TProperties>>();
  }

  protected init<T>(params: InitParams<TProperties>, callback: () => Promise<T>) {
    return this.manager.run({
      properties: params.properties,
      start: new Date(),
      traceId: params.traceId ?? RandomizeUtil.uuid(),
    }, callback);
  }

  public get() {
    const store = this.manager.getStore();

    if(!store) {
      throw new UnknownException({
        feedback: {
          enUs: 'Context was not initialized.',
          esEs: 'El contexto no fue inicializado.',
          ptBr: 'O contexto não foi inicializado.',
        },
        message: 'Context not initialized.',
      });
    }

    return store;
  }

  public log(params: {
    level: 'error' | 'info' | 'warn';
    message: string;
    meta?: Parameters<typeof LoggingUtil.info>[1];
  }) {
    const context = this.get();
    const meta = {
      ...params.meta,
      traceId: context.traceId,
    };

    switch(params.level) {
      case 'error':
        LoggingUtil.error(params.message, meta);
        break;
      case 'info':
        LoggingUtil.info(params.message, meta);
        break;
      case 'warn':
        LoggingUtil.warn(params.message, meta);
        break;
    }
  }
}
