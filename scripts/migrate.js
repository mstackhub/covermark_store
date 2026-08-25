import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ Error: TURSO_DATABASE_URL is missing in environment variables (.env)');
  process.exit(1);
}

const client = createClient({
  url: url,
  authToken: authToken
});

async function runMigration() {
  console.log('🔄 Connecting to Turso and applying database migrations...');

  try {
    // 1. Create Table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        store TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        province TEXT NOT NULL,
        floor TEXT,
        phone TEXT,
        lat REAL,
        lng REAL,
        map_url TEXT,
        status TEXT NOT NULL DEFAULT 'Active'
      );
    `);
    console.log('✅ Table "branches" checked / created.');

    // 2. Create Indexes
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_branches_status
      ON branches(status);
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_branches_store
      ON branches(store);
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_branches_province
      ON branches(province);
    `);

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_branches_active_location
      ON branches(status, province, store);
    `);
    console.log('✅ Indexes checked / created.');

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
