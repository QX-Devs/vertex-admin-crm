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

console.log(`Attempting connection to ${host}:${port}/${database} as ${user}...`);

const pool = new Pool({
  host,
  port,
  database,
  user,
  password,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const info = await pool.query('SELECT NOW() as current_time, current_database() as database, version() as version;');
    console.log('Connection successful!');
    console.log('Database Info:', info.rows[0]);

    const tables = await pool.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n--- Existing Tables in public schema ---');
    console.table(tables.rows);

    for (const row of tables.rows) {
      if (row.table_type === 'BASE TABLE') {
        const countRes = await pool.query(`SELECT COUNT(*) as count FROM public."${row.table_name}";`);
        console.log(`Table ${row.table_name}: ${countRes.rows[0].count} rows`);
      }
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    await pool.end();
  }
}

run();
