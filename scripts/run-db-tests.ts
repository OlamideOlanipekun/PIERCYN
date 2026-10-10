import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const testUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL_NON_POOLING_TEST;
const productionUrl = process.env.DATABASE_URL_NON_POOLING || process.env.DATABASE_URL;

if (!testUrl) {
  console.error('DATABASE_URL_TEST or DATABASE_URL_NON_POOLING_TEST is required for database-backed tests.');
  process.exit(1);
}

if (productionUrl && testUrl === productionUrl) {
  console.error('The configured test database must not match the production runtime database.');
  process.exit(1);
}

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(command, ['exec', 'vitest', 'run'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'test' },
});

process.exit(result.status ?? 1);
