import { QueryOptions, Repository } from '@self/abstractions';

class UsersRepository extends Repository<'users'> {
  constructor() {
    super({
      table: 'users',
    });
  }

  public selectByEmail(email: string, options?: QueryOptions) {
    return this.select(options)
      .selectAll()
      .where('users.email', '=', email);
  }

  public touchLastAuthenticationAt(params: {
    id: string;
    lastAuthenticationAt: Date;
  }, options?: QueryOptions) {
    return this.update({
      lastAuthenticationAt: params.lastAuthenticationAt,
    }, options)
      .where('users.id', '=', params.id);
  }
}

const repository = new UsersRepository();

export { repository as UsersRepository };
