import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db/index';

async function migrateConsolidatedTables() {
  try {
    console.log('Starting data migration to consolidated tables...');

    // Step 1: Create new consolidated tables if they don't exist
    console.log('Creating new consolidated tables...');
    
    // Create user_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar(255) NOT NULL UNIQUE,
        "preferences" jsonb DEFAULT '{}',
        "chat_settings" jsonb DEFAULT '{}',
        "notification_settings" jsonb DEFAULT '{}',
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `);

    // Create user_providers table  
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user_providers" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar(255) NOT NULL,
        "provider" varchar(50) NOT NULL,
        "encrypted_api_key" text,
        "is_enabled" boolean DEFAULT true,
        "default_model" varchar(100),
        "custom_models" jsonb DEFAULT '[]',
        "settings" jsonb DEFAULT '{}',
        "last_validated" timestamp with time zone,
        "validation_status" varchar(20) DEFAULT 'pending',
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now(),
        UNIQUE("user_id", "provider")
      )
    `);

    // Step 2: Check if old tables exist and migrate data
    const checkTable = async (tableName: string) => {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${tableName}
        )
      `);
      return (result as any)[0]?.exists || false;
    };

    // Migrate user_preferences data
    if (await checkTable('user_preferences')) {
      console.log('Migrating user_preferences data...');
      await db.execute(sql`
        INSERT INTO "user_settings" (user_id, preferences, chat_settings, notification_settings, created_at, updated_at)
        SELECT 
          user_id,
          jsonb_build_object(
            'theme', COALESCE(theme, 'system'),
            'language', COALESCE(language, 'en')
          ) || COALESCE(ui_settings, '{}'),
          COALESCE(chat_settings, '{}'),
          COALESCE(notification_settings, '{}'),
          created_at,
          updated_at
        FROM "user_preferences"
        ON CONFLICT (user_id) DO UPDATE SET
          preferences = EXCLUDED.preferences,
          chat_settings = EXCLUDED.chat_settings,
          notification_settings = EXCLUDED.notification_settings,
          updated_at = EXCLUDED.updated_at
      `);
    }

    // Migrate API keys data
    if (await checkTable('user_api_keys')) {
      console.log('Migrating user_api_keys data...');
      await db.execute(sql`
        INSERT INTO "user_providers" (user_id, provider, encrypted_api_key, is_enabled, last_validated, validation_status, created_at, updated_at, settings)
        SELECT 
          user_id,
          provider,
          encrypted_api_key,
          COALESCE(is_active, true),
          last_validated,
          COALESCE(validation_status, 'pending'),
          created_at,
          updated_at,
          COALESCE(metadata, '{}')
        FROM "user_api_keys"
        ON CONFLICT (user_id, provider) DO UPDATE SET
          encrypted_api_key = EXCLUDED.encrypted_api_key,
          is_enabled = EXCLUDED.is_enabled,
          last_validated = EXCLUDED.last_validated,
          validation_status = EXCLUDED.validation_status,
          settings = EXCLUDED.settings,
          updated_at = EXCLUDED.updated_at
      `);
    }

    // Migrate provider preferences
    if (await checkTable('user_provider_preferences')) {
      console.log('Migrating user_provider_preferences data...');
      await db.execute(sql`
        INSERT INTO "user_providers" (user_id, provider, is_enabled, default_model, settings, created_at, updated_at)
        SELECT 
          user_id,
          provider,
          COALESCE(is_enabled, true),
          default_model,
          COALESCE(settings, '{}'),
          created_at,
          updated_at
        FROM "user_provider_preferences"
        ON CONFLICT (user_id, provider) DO UPDATE SET
          is_enabled = EXCLUDED.is_enabled,
          default_model = COALESCE(EXCLUDED.default_model, "user_providers".default_model),
          settings = EXCLUDED.settings || "user_providers".settings,
          updated_at = EXCLUDED.updated_at
      `);
    }

    // Migrate custom models
    if (await checkTable('user_custom_models')) {
      console.log('Migrating user_custom_models data...');
      
      // Group custom models by user and provider, then update user_providers
      await db.execute(sql`
        WITH custom_models_grouped AS (
          SELECT 
            user_id,
            provider,
            jsonb_agg(
              jsonb_build_object(
                'id', id,
                'modelId', model_id,
                'displayName', display_name,
                'description', description,
                'maxTokens', max_tokens,
                'supportsVision', supports_vision,
                'supportsTools', supports_tools,
                'supportsAudio', supports_audio,
                'supportsVideo', supports_video,
                'supportsDocument', supports_document,
                'costPer1kInputTokens', cost_per_1k_input_tokens,
                'costPer1kOutputTokens', cost_per_1k_output_tokens,
                'isActive', is_active,
                'metadata', metadata
              )
            ) as custom_models
          FROM "user_custom_models"
          WHERE is_active = true
          GROUP BY user_id, provider
        )
        INSERT INTO "user_providers" (user_id, provider, custom_models, created_at, updated_at)
        SELECT 
          user_id,
          provider,
          custom_models,
          now(),
          now()
        FROM custom_models_grouped
        ON CONFLICT (user_id, provider) DO UPDATE SET
          custom_models = EXCLUDED.custom_models,
          updated_at = EXCLUDED.updated_at
      `);
    }

    // Step 3: Add indexes to new tables
    console.log('Adding indexes to new tables...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "user_settings_user_id_idx" ON "user_settings" (user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "user_providers_user_id_idx" ON "user_providers" (user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "user_providers_provider_idx" ON "user_providers" (provider)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "user_providers_user_provider_idx" ON "user_providers" (user_id, provider)`);

    console.log('Data migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the application with new schema');
    console.log('2. If everything works, run cleanup script to drop old tables');
    console.log('3. Update type definitions to match new schema');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

// Optional cleanup function (run separately after testing)
export async function cleanupOldTables() {
  console.log('WARNING: This will permanently delete old tables!');
  console.log('Only run after confirming new schema works correctly.');
  
  const oldTables = [
    'user_preferences',
    'user_api_keys', 
    'user_custom_models',
    'user_provider_preferences'
  ];

  for (const table of oldTables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
      console.log(`Dropped table: ${table}`);
    } catch (error) {
      console.warn(`Could not drop table ${table}:`, error);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateConsolidatedTables();
}

export default migrateConsolidatedTables;