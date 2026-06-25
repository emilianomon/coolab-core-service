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

const maxConnections = 10;

const createPool = (connectionString: string) => {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 60000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    max: maxConnections,
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

const readPools = [
  env.DATABASE_READ_CONNECTION_STRING_1,
  env.DATABASE_READ_CONNECTION_STRING_2,
]
  .filter((connectionString): connectionString is string => !!connectionString)
  .map(connectionString => createPool(connectionString));

const pools = readPools.length ? readPools : [writePool];

const readConnections = pools.map((pool, index) => ({
  conn: createConnection(pool),
  index,
  pool,
}));

export function getReadConnection(): Kysely<DataBaseSchema> {
  const loggingMeta: Record<string, unknown> = {
    selectedPool: 0,
  };

  const connections = [...readConnections];

  for(const [index, item] of connections.entries()) {
    loggingMeta[`waitingCount${index}`] = item.pool.waitingCount;
    loggingMeta[`totalCount${index}`] = item.pool.totalCount;
    loggingMeta[`idleCount${index}`] = item.pool.idleCount;

    if(item.pool.totalCount >= maxConnections || item.pool.waitingCount >= 5) {
      logging().warn('Read connection pool is at max capacity.', {
        idleCount: item.pool.idleCount,
        pool: item.index,
        totalCount: item.pool.totalCount,
        waitingCount: item.pool.waitingCount,
      });
    }
  }

  const setSelection = (item: typeof connections[number]) => {
    loggingMeta['selectedPool'] = item.index;
    logging().info(`Read connections ${JSON.stringify(loggingMeta)}`, {
      ...loggingMeta,
    });
  };

  const [firstByWaiting, secondByWaiting] = connections.sort((a, b) => {
    return a.pool.waitingCount - b.pool.waitingCount;
  });

  if(secondByWaiting && firstByWaiting.pool.waitingCount < secondByWaiting.pool.waitingCount) {
    setSelection(firstByWaiting);
    return firstByWaiting.conn;
  }

  const [firstByTotalCount, secondByTotalCount] = connections.sort((a, b) => {
    return a.pool.totalCount - b.pool.totalCount;
  });

  if(secondByTotalCount && firstByTotalCount.pool.totalCount < secondByTotalCount.pool.totalCount) {
    setSelection(firstByTotalCount);
    return firstByTotalCount.conn;
  }

  const [mostIdleCountPool] = connections.sort((a, b) => {
    return b.pool.idleCount - a.pool.idleCount;
  });

  setSelection(mostIdleCountPool);

  return mostIdleCountPool.conn;
}
