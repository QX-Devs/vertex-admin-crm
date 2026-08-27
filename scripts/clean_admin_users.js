const { getPgPool } = require('../lib/db');

async function cleanAdminUsers() {
  const pool = getPgPool();
  try {
    console.log('--- Cleaning Admin Users ---');
    // Delete demo users
    const delRes = await pool.query("DELETE FROM public.admin_users WHERE email != 'admin';");
    console.log(`Deleted ${delRes.rowCount} demo admin user(s).`);

    // Ensure 'admin' user is present with MD5 hash
    await pool.query(`
      INSERT INTO public.admin_users (id, email, password_hash, name, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'admin',
        '9f44f269db9b91374f4bfb07071b961b',
        'Administrator',
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

    // Verify
    const allUsers = await pool.query("SELECT id, email, name, role, password_hash FROM public.admin_users;");
    console.log('\nFinal Admin Users in Supabase PostgreSQL:');
    console.table(allUsers.rows);

  } catch (err) {
    console.error('Error cleaning admin users:', err);
  } finally {
    await pool.end();
  }
}

cleanAdminUsers();
