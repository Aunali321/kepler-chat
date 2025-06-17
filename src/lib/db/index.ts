import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Force Node.js runtime - this file should only be used in Node.js environment
// Never import this file in middleware or edge runtime code

// Allow builds without DATABASE_URL for static builds
const DATABASE_URL = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle>;
let sql: ReturnType<typeof postgres> | undefined;

if (DATABASE_URL) {
  // Configure connection with appropriate settings for production
  sql = postgres(DATABASE_URL, {
    max: 20,
    idle_timeout: 30,
    connect_timeout: 2,
  });
  db = drizzle(sql, { schema });
} else {
  // Create a mock db for build time when DATABASE_URL is not available
  db = {} as ReturnType<typeof drizzle>;
}

export { db, sql };
export * from './schema';