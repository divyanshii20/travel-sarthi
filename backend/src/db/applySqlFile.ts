import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../config/database';
import { logger } from '../shared/logger';

async function main() {
  const relativePath = process.argv[2];

  if (relativePath == null || relativePath.trim().length === 0) {
    throw new Error('Usage: tsx src/db/applySqlFile.ts <relative-sql-path>');
  }

  const absolutePath = path.resolve(process.cwd(), '..', relativePath);
  const sql = await readFile(absolutePath, 'utf8');

  logger.info({ absolutePath }, 'Applying SQL file');
  await pool.query(sql);
  logger.info({ absolutePath }, 'SQL file applied successfully');
}

main()
  .catch((error) => {
    logger.error({ error }, 'Failed to apply SQL file');
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
