import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class BadImplementationException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 500,
    });
  }
}
