import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class ForbiddenException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 403,
    });
  }
}
