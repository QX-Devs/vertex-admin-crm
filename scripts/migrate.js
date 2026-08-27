const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function parseEnv() {
  const envPath = path.join(process.cwd(), '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        env[key] = val;
      }
    }
  }
  return env;
}

const env = parseEnv();
const host = env.host || env.POSTGRES_HOST;
const port = parseInt(env.port || env.POSTGRES_PORT || '5432', 10);
const database = env.database || env.POSTGRES_DB || 'postgres';
const user = env.user || env.POSTGRES_USER || 'postgres';
const password = env.password || env.POSTGRES_PASSWORD;

console.log(`Connecting to PostgreSQL at ${host}:${port}/${database} as ${user}...`);

const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('=== Step 1: Cleaning & Dropping Existing Public Tables ===');
    await client.query('BEGIN');

    // Drop all tables in public schema cleanly with CASCADE
    const dropTablesSql = `
      DROP TABLE IF EXISTS public.audit_logs CASCADE;
      DROP TABLE IF EXISTS public.channel_integrations CASCADE;
      DROP TABLE IF EXISTS public.admin_users CASCADE;
      DROP TABLE IF EXISTS public.admin_notifications CASCADE;
      DROP TABLE IF EXISTS public.leads_orders CASCADE;
      DROP TABLE IF EXISTS public.conversations CASCADE;
      DROP TABLE IF EXISTS public.usage_counters CASCADE;
      DROP TABLE IF EXISTS public.idempotency_keys CASCADE;
      DROP TABLE IF EXISTS public.client_knowledge_base CASCADE;
      DROP TABLE IF EXISTS public.client_settings CASCADE;
      DROP TABLE IF EXISTS public.clients CASCADE;
      DROP TABLE IF EXISTS public.plans CASCADE;
      DROP TABLE IF EXISTS public.chat_sessions CASCADE;
      DROP TABLE IF EXISTS public.workflow_errors CASCADE;
    `;
    await client.query(dropTablesSql);
    await client.query('COMMIT');
    console.log('Successfully dropped previous tables.');

    console.log('\n=== Step 2: Applying Migration 001_initial_schema.sql ===');
    const m1 = fs.readFileSync(path.join(__dirname, '../lib/migrations/001_initial_schema.sql'), 'utf8');
    await client.query(m1);
    console.log('Applied 001_initial_schema.sql');

    console.log('\n=== Step 3: Applying Migration 002_channel_integrations_and_audit.sql ===');
    const m2 = fs.readFileSync(path.join(__dirname, '../lib/migrations/002_channel_integrations_and_audit.sql'), 'utf8');
    await client.query(m2);
    console.log('Applied 002_channel_integrations_and_audit.sql');

    console.log('\n=== Step 4: Applying Migration 003_hardening_and_rls.sql ===');
    const m3 = fs.readFileSync(path.join(__dirname, '../lib/migrations/003_hardening_and_rls.sql'), 'utf8');
    await client.query(m3);
    console.log('Applied 003_hardening_and_rls.sql');

    console.log('\n=== Migration completed successfully! ===');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
