const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
const env = {};
for (const l of lines) {
  const t = l.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx !== -1) env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
}

const pool = new Pool({
  host: env.POSTGRES_HOST || env.host,
  port: parseInt(env.POSTGRES_PORT || env.port || '5432', 10),
  database: env.POSTGRES_DB || env.database || 'postgres',
  user: env.POSTGRES_USER || env.user || 'postgres',
  password: env.POSTGRES_PASSWORD || env.password,
  ssl: { rejectUnauthorized: false }
});

async function cleanAllTestClients() {
  const client = await pool.connect();
  try {
    console.log('=== Purging all temp/test clients and mock data from Supabase PostgreSQL ===');
    await client.query('BEGIN');

    await client.query('TRUNCATE TABLE public.conversations, public.leads_orders, public.admin_notifications, public.usage_counters, public.idempotency_keys, public.channel_integrations, public.client_knowledge_base, public.client_settings, public.clients CASCADE;');
    
    // Clean audit logs of test clients
    await client.query("DELETE FROM public.audit_logs WHERE entity = 'client' OR entity = 'integration';");

    await client.query('COMMIT');
    console.log('=== Database successfully cleaned! 0 clients, 0 test chats, 0 mock leads. Ready for real production tenants. ===');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to clean database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanAllTestClients();
