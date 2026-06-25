import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class BadRequestException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 400,
    });
  }
}
