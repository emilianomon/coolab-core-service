import { Exception, ExceptionParams } from '@self/abstractions/exception';

export class NotFoundException extends Exception {
  constructor(params: Omit<ExceptionParams, 'status'>) {
    super({
      ...params,
      status: 404,
    });
  }
}
