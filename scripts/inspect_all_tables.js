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
const pool = new Pool({
  host: env.host || env.POSTGRES_HOST,
  port: parseInt(env.port || env.POSTGRES_PORT || '5432', 10),
  database: env.database || env.POSTGRES_DB || 'postgres',
  user: env.user || env.POSTGRES_USER || 'postgres',
  password: env.password || env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function inspectAll() {
  try {
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('=== All Public Tables in Supabase ===');
    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const colRes = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);
      
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM public."${tableName}";`);
      console.log(`\nTable: public.${tableName} (Rows: ${countRes.rows[0].count})`);
      console.log('Columns:', colRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
      
      const sample = await pool.query(`SELECT * FROM public."${tableName}" LIMIT 2;`);
      if (sample.rows.length > 0) {
        console.log('Sample row:', JSON.stringify(sample.rows[0], null, 2));
      }
    }
  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await pool.end();
  }
}

inspectAll();
