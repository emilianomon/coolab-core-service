import {
  connection,
  DataBaseSchema,
  getReadConnection,
} from '@self/database';
import {
  Insertable,
  Transaction,
  Updateable,
} from 'kysely';
import { z } from 'zod';

export type QueryOptions = {
  forceWriteConnection?: boolean;
  includeRemoved?: boolean;
  transaction?: Transaction<DataBaseSchema>;
};

export abstract class Repository<T extends keyof DataBaseSchema> {
  private table: T;

  constructor(params: {
    table: T;
  }) {
    this.table = params.table;
  }

  public insert(toSet: Insertable<DataBaseSchema[T]> | Array<Insertable<DataBaseSchema[T]>>, options: QueryOptions = {}) {
    return (options.transaction || connection).insertInto(this.table).values(toSet);
  }

  public update(toSet: Updateable<DataBaseSchema[T]>, options: QueryOptions = {}) {
    const query = (options.transaction || connection).updateTable(this.table);
    // @ts-expect-error Kysely cannot keep generic table update signatures compatible across table unions.
    return query.set(toSet);
  }

  public select(options: QueryOptions = {}) {
    if(options.transaction) return options.transaction.selectFrom(this.table);
    if(options.forceWriteConnection) return connection.selectFrom(this.table);
    return getReadConnection().selectFrom(this.table);
  }

  public delete(options: QueryOptions = {}) {
    return (options.transaction || connection).deleteFrom(this.table);
  }

  public selectById(id: string, options: QueryOptions = {}) {
    const conn = options.transaction
      || (options.forceWriteConnection ? connection : getReadConnection());

    const query = conn.selectFrom(this.table);
    // @ts-expect-error Kysely cannot infer generic table columns from the shared EntityTable contract.
    return query.where(`${String(this.table)}.id`, '=', id);
  }

  public jsonUpdateValidation<TSchema extends z.ZodType>(params: {
    schema: TSchema;
    value?: z.infer<TSchema>;
  }) {
    if(params.value === undefined) return params.value;
    return this.jsonValidation({
      schema: params.schema,
      value: params.value,
    });
  }

  public jsonInsertValidation<TSchema extends z.ZodType>(params: {
    schema: TSchema;
    value: z.infer<TSchema>;
  }) {
    return this.jsonValidation(params);
  }

  private jsonValidation<TSchema extends z.ZodType>(params: {
    schema: TSchema;
    value: z.infer<TSchema>;
  }) {
    return params.schema.parse(params.value);
  }
}
