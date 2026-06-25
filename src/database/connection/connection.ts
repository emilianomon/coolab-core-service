import { env } from '@self/consts';
import { UsersTable } from '@self/database/tables';
import { data, logging } from '@self/utils';
import {
  CamelCasePlugin,
  Kysely,
  PostgresDialect,
} from 'kysely';
import { Pool } from 'pg';

export type DataBaseSchema = {
  users: UsersTable.Schema;
};

const createPool = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    max: 20,
    min: 0,
    query_timeout: 120000,
  });

  pool.on('error', error => {
    logging().error('Unhandled database pool error.', {
      error: data().stringifyError(error),
    });
  });

  pool.on('connect', client => {
    client.on('error', error => {
      logging().error('Unhandled database client error.', {
        error: data().stringifyError(error),
      });
    });
  });

  return pool;
};

const createConnection = (pool: Pool) => {
  return new Kysely<DataBaseSchema>({
    dialect: new PostgresDialect({
      pool,
    }),
    log: message => {
      if(message.level === 'error') {
        const query = 'query' in message ? message.query : undefined;

        logging().error('Database error.', {
          error: data().stringifyError(message.error),
          parameters: query?.parameters,
          queryDurationMillis: message.queryDurationMillis,
          sql: query?.sql,
        });
      }
    },
    plugins: [
      new CamelCasePlugin(),
    ],
  });
};

const writePool = createPool(env.DATABASE_CONNECTION_STRING);
export const connection = createConnection(writePool);

const readConnection = env.DATABASE_READ_CONNECTION_STRING
  ? createConnection(createPool(env.DATABASE_READ_CONNECTION_STRING))
  : connection;

export const getReadConnection = () => readConnection;
