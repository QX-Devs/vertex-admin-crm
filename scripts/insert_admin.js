const { getPgPool } = require('../lib/db');
const { authenticateAdmin } = require('../lib/auth');

async function insertAdmin() {
  const pool = getPgPool();
  try {
    console.log('--- Inserting Admin User in Supabase ---');
    
    // Insert/update user with email/username 'admin'
    await pool.query(`
      INSERT INTO public.admin_users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'admin',
        '9f44f269db9b91374f4bfb07071b961b',
        'Super Administrator',
        'superadmin',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        password_hash = '9f44f269db9b91374f4bfb07071b961b',
        role = 'superadmin',
        updated_at = NOW();
    `);

    // Also sync admin@example.com
    await pool.query(`
      INSERT INTO public.admin_users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'admin@example.com',
        '9f44f269db9b91374f4bfb07071b961b',
        'Super Administrator',
        'superadmin',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        password_hash = '9f44f269db9b91374f4bfb07071b961b',
        role = 'superadmin',
        updated_at = NOW();
    `);

    console.log('Admin user successfully inserted/updated in Supabase!');

    // Test authentication
    console.log('\n--- Testing Authentication ---');
    const auth1 = await authenticateAdmin('admin', '9f44f269db9b91374f4bfb07071b961b');
    console.log('Login check with username "admin" and MD5 hash:', auth1 ? `SUCCESS (User: ${auth1.email}, Role: ${auth1.role})` : 'FAILED');

    const auth2 = await authenticateAdmin('admin@example.com', '9f44f269db9b91374f4bfb07071b961b');
    console.log('Login check with "admin@example.com" and MD5 hash:', auth2 ? `SUCCESS (User: ${auth2.email}, Role: ${auth2.role})` : 'FAILED');

    const allUsers = await pool.query('SELECT id, email, name, role, password_hash FROM public.admin_users;');
    console.log('\nAll Admin Users in Supabase PostgreSQL:');
    console.table(allUsers.rows);

  } catch (err) {
    console.error('Error inserting admin:', err);
  } finally {
    await pool.end();
  }
}

insertAdmin();
