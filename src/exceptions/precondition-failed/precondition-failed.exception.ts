import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class PreconditionFailedException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 412,
    });
  }
}
