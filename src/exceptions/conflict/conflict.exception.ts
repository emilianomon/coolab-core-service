import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class ConflictException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 409,
    });
  }
}
