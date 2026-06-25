import {
  EntityTable,
  NonRemovableEntityTable,
  WeakEntityTable,
} from '@self/types';
import { Selectable } from 'kysely';
import { z } from 'zod';

import { datetime } from '../datetime';
import { id } from '../id';

type ToExclude = {
  createdAt: ReturnType<typeof datetime>;
  id: z.ZodUUID;
  updatedAt: ReturnType<typeof datetime>;
};

type ToExcludeWeak = {
  createdAt: ReturnType<typeof datetime>;
  updatedAt: ReturnType<typeof datetime>;
};

type ToExcludeNonRemovable = ToExclude & {
  isRemoved: z.ZodBoolean;
};

const ensureField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  return schema.refine(value => {
    const values = Object.values(value);
    return values.some(item => item !== undefined);
  }, 'At least one field must be defined.');
};

const entity = () => z.object({
  createdAt: datetime(),
  id: id(),
  updatedAt: datetime(),
}) satisfies z.ZodType<Selectable<EntityTable>>;

const weakEntity = () => z.object({
  createdAt: datetime(),
  updatedAt: datetime(),
}) satisfies z.ZodType<Selectable<WeakEntityTable>>;

const nonRemovableEntity = () => z.object({
  createdAt: datetime(),
  id: id(),
  isRemoved: z.boolean(),
  updatedAt: datetime(),
}) satisfies z.ZodType<Selectable<EntityTable & NonRemovableEntityTable>>;

const insertable = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T & ToExclude>,
) => schema.omit({
    createdAt: true,
    id: true,
    updatedAt: true,
  });

const updatable = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T & ToExclude>,
) => insertable(schema).partial();

const weakInsertable = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T & ToExcludeWeak>,
) => schema.omit({
    createdAt: true,
    updatedAt: true,
  });

const weakUpdatable = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T & ToExcludeWeak>,
) => weakInsertable(schema).partial();

const nonRemovableInsertable = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T & ToExcludeNonRemovable>,
) => schema.omit({
    createdAt: true,
    id: true,
    isRemoved: true,
    updatedAt: true,
  });

const nonRemovableUpdatable = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T & ToExcludeNonRemovable>,
) => nonRemovableInsertable(schema).partial();

const queryArray = <TSchema extends z.ZodType>(schema: TSchema) => z.union([
  z.array(schema),
  schema,
]).default([]).transform(value => {
  if(Array.isArray(value)) return value;
  return [value];
});

const table = () => ({
  entity,
  insertable,
  nonRemovableEntity,
  nonRemovableInsertable,
  nonRemovableUpdatable,
  updatable,
  weakEntity,
  weakInsertable,
  weakUpdatable,
});

export const helpers = () => ({
  ensureField,
  queryArray,
  table,
});
