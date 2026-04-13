import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';
import * as schema from '../db/schema';
import { logger } from '../shared/logger';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error');
});

pool.on('connect', () => {
  logger.debug('PostgreSQL client connected');
});

export const db = drizzle(pool, { schema, logger: env.NODE_ENV === 'development' });

export async function connectDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info({ timestamp: result.rows[0]?.now }, 'PostgreSQL connected');
  } catch (err) {
    logger.error({ err }, 'Failed to connect to PostgreSQL');
    throw err;
  }
}

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL pool closed');
}

export { pool };
