import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class TooManyRequestsException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 429,
    });
  }
}
