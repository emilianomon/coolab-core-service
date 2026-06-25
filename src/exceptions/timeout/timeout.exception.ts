import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class TimeoutException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 504,
    });
  }
}
