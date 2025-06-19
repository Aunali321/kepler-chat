import { sql } from "drizzle-orm";
import { db } from "../src/lib/db/index";

async function forceResetDatabase() {
  try {
    console.log("🔥 FORCE RESETTING DATABASE - DROPPING EVERYTHING...");

    // Drop ALL tables that might exist (from old schemas)
    const tablesToDrop = [
      "files",
      "messages",
      "usage_metrics",
      "chat_shares",
      "chats",
      "user_settings",
      "user_providers",
      "custom_tools",
      "verification",
      "session",
      "account",
      "user",
      // Old table names that might exist
      "chat_folders",
      "user_preferences",
      "user_custom_models",
      "chat_tag_relations",
      "user_provider_preferences",
      "user_api_keys",
      "chat_tags",
      "sessions",
      "users",
    ];

    console.log("🗑️  Dropping all possible tables...");
    for (const table of tablesToDrop) {
      try {
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
        console.log(`   ✓ Dropped ${table}`);
      } catch (error) {
        console.log(`   - ${table} (not found)`);
      }
    }

    // Drop drizzle migration tables
    await db.execute(sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE;`);
    await db.execute(sql`DROP SCHEMA IF EXISTS "drizzle" CASCADE;`);

    console.log("✅ All tables force-dropped!");
  } catch (error) {
    console.error("❌ Error force-resetting database:", error);
    throw error;
  }
}

// Run the reset
forceResetDatabase()
  .then(() => {
    console.log("🎉 Force reset completed! Database is completely clean.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Force reset failed:", error);
    process.exit(1);
  });
