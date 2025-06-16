import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Allow builds without DATABASE_URL for static builds
const DATABASE_URL = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle>;

if (DATABASE_URL) {
  const sql = postgres(DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  // Create a mock db for build time
  db = {} as ReturnType<typeof drizzle>;
}

export { db };
export * from './schema';