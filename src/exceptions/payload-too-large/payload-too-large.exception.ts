import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class PayloadTooLargeException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 413,
    });
  }
}
