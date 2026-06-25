import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class UnauthorizedException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 401,
    });
  }
}
