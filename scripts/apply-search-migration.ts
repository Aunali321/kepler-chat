import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db/index';

async function applySearchMigration() {
  try {
    console.log('Applying full-text search migration...');

    // Add tsvector column
    await db.execute(sql`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "search_vector" tsvector`);

    // Create function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION update_messages_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger
    await db.execute(sql`
      DROP TRIGGER IF EXISTS update_messages_search_vector_trigger ON "messages";
      CREATE TRIGGER update_messages_search_vector_trigger
        BEFORE INSERT OR UPDATE ON "messages"
        FOR EACH ROW
        EXECUTE FUNCTION update_messages_search_vector();
    `);

    // Create GIN index
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "messages_search_vector_idx" ON "messages" USING gin("search_vector")`);

    // Update existing records
    await db.execute(sql`UPDATE "messages" SET search_vector = to_tsvector('english', COALESCE(content, '')) WHERE search_vector IS NULL`);

    // Add full-text search index for chat titles
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "chats_title_gin_idx" ON "chats" USING gin(to_tsvector('english', title))`);

    console.log('Full-text search migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applySearchMigration();