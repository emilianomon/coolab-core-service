import { AsyncLocalStorage } from 'node:async_hooks';

import { UnknownException } from '@self/exceptions';
import { randomize } from '@self/utils';
import { logging } from '@self/utils/logging';

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
      traceId: params.traceId ?? randomize().uuid(),
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
    meta?: Parameters<ReturnType<typeof logging>['info']>[1];
  }) {
    const context = this.get();
    const meta = {
      ...params.meta,
      traceId: context.traceId,
    };

    switch(params.level) {
      case 'error':
        logging().error(params.message, meta);
        break;
      case 'info':
        logging().info(params.message, meta);
        break;
      case 'warn':
        logging().warn(params.message, meta);
        break;
    }
  }
}
