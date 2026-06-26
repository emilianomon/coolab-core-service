import { UsersTable } from '@self/database';
import { InferFromValidation, SelectableTableSchema } from '@self/types';
import { z } from 'zod';

import { datetime } from '../../datetime';
import { email } from '../../email';
import { helpers } from '../../helpers';

type Selectable = SelectableTableSchema<UsersTable.Schema>;

const selectable = () => helpers().table().entity().extend({
  email: email()
    .describe('The email address of the user.'),
  emailStatus: z.enum(['pending', 'verified'])
    .describe('The email verification status of the user.'),
  lastAuthenticationAt: datetime().nullable()
    .describe('The last time the user authenticated.'),
  name: z.string().min(1).max(120).nullable()
    .describe('The display name of the user.'),
  picture: z.string().url().nullable()
    .describe('The public picture URL for the user.'),
}) satisfies z.ZodType<Selectable>;

const insertable = () => helpers().table().insertable(selectable()).omit({
  email: true,
  emailStatus: true,
  lastAuthenticationAt: true,
});

const updatable = () => helpers().table().updatable(selectable())
  .omit({
    email: true,
    emailStatus: true,
    lastAuthenticationAt: true,
  })
  .partial();

export type SelectableUser = InferFromValidation<ReturnType<typeof selectable>>;
export type InsertableUser = InferFromValidation<ReturnType<typeof insertable>>;
export type UpdatableUser = InferFromValidation<ReturnType<typeof updatable>>;

export const users = () => ({
  insertable,
  selectable,
  updatable,
});
