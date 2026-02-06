/**
 * Check what schemas exist in the database
 */

// CRITICAL: Load environment variables BEFORE any imports
import { config } from 'dotenv';
config({ path: '.env.development.local' });

import { db } from '../lib/db';

async function checkSchemas() {
  try {
    console.log('\nChecking database schemas...\n');

    // Query all schemas
    const schemas = await db.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name
      FROM information_schema.schemata
      ORDER BY schema_name
    `;

    console.log('Available schemas:');
    schemas.forEach(s => console.log(`  - ${s.schema_name}`));

    // Check for neon_auth tables specifically
    console.log('\nChecking for auth-related tables in all schemas...\n');
    const authTables = await db.$queryRaw<Array<{
      table_schema: string;
      table_name: string;
    }>>`
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_name LIKE '%user%'
      ORDER BY table_schema, table_name
    `;

    console.log('Tables with "user" in name:');
    authTables.forEach(t => console.log(`  - ${t.table_schema}.${t.table_name}`));

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

checkSchemas();
