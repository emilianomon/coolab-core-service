import fs from 'node:fs/promises';
import path from 'node:path';

import { env } from '@self/consts';
import { Client } from 'pg';

type Direction = 'down' | 'up';

type Migration = {
  direction: Direction;
  id: string;
  name: string;
  path: string;
};

const directionSchema = (value: string | undefined): Direction => {
  if(value === 'up' || value === 'down') return value;

  console.error('Usage: migrate.ts <up|down>');
  process.exit(1);
};

const migrationsDirectory = path.resolve(__dirname, '../src/database/migrations');

const ensureMigrationsTable = async (client: Client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

const listMigrations = async (direction: Direction): Promise<Array<Migration>> => {
  const files = await fs.readdir(migrationsDirectory);
  const suffix = `.${direction}.sql`;

  return files
    .filter(file => file.endsWith(suffix))
    .sort()
    .map(file => ({
      direction,
      id: file.split('.')[0],
      name: file,
      path: path.join(migrationsDirectory, file),
    }));
};

const migrateUp = async (client: Client) => {
  const migrations = await listMigrations('up');
  const applied = await client.query<{ id: string; }>('SELECT id FROM schema_migrations');
  const appliedIds = new Set(applied.rows.map(row => row.id));

  for(const migration of migrations) {
    if(appliedIds.has(migration.id)) continue;

    const sql = await fs.readFile(migration.path, 'utf8');
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (id, name) VALUES ($1, $2)',
      [migration.id, migration.name],
    );
    console.log(`Applied ${migration.name}`);
  }
};

const migrateDown = async (client: Client) => {
  const latest = await client.query<{ id: string; name: string; }>(`
    SELECT id, name
    FROM schema_migrations
    ORDER BY id DESC
    LIMIT 1
  `);

  const migrationRecord = latest.rows[0];
  if(!migrationRecord) {
    console.log('No migrations to roll back.');
    return;
  }

  const downName = migrationRecord.name.replace('.up.sql', '.down.sql');
  const downPath = path.join(migrationsDirectory, downName);
  const sql = await fs.readFile(downPath, 'utf8');

  await client.query(sql);
  await client.query('DELETE FROM schema_migrations WHERE id = $1', [migrationRecord.id]);
  console.log(`Rolled back ${downName}`);
};

const main = async () => {
  const direction = directionSchema(process.argv[2]);
  const client = new Client({
    connectionString: env.DATABASE_CONNECTION_STRING,
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);

    if(direction === 'up') {
      await migrateUp(client);
    } else {
      await migrateDown(client);
    }
  } finally {
    await client.end();
  }
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
