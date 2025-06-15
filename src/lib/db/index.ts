import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Allow builds without DATABASE_URL for static builds
const DATABASE_URL = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle>;

if (DATABASE_URL) {
  const sql = neon(DATABASE_URL);
  db = drizzle(sql, { schema });
} else {
  // Create a mock db for build time
  db = {} as ReturnType<typeof drizzle>;
}

export { db };
export * from './schema';