import { EntityTable } from '@self/types';

export namespace UsersTable {
  export type Schema = EntityTable & {
    email: string;
    emailStatus: 'pending' | 'verified';
    lastAuthenticationAt: Date | null;
    name: string | null;
    picture: string | null;
  };
}
