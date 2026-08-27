import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const config = await db.getSupabaseConfig();
    const liveHealth = await db.testDatabaseConnectivity();

    return NextResponse.json({
      config,
      liveHealth
    });
  } catch (error: any) {
    console.error('Fetch Supabase config error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Supabase configuration' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      host,
      port,
      database,
      user,
      password,
      supabase_url,
      supabase_anon_key,
      supabase_service_role_key,
      ssl_mode,
      pool_max,
      idle_timeout_ms,
      connection_timeout_ms,
      is_active
    } = body;

    const beforeState = await db.getSupabaseConfig();

    const saved = await db.saveSupabaseConfig({
      host,
      port: Number(port) || 5432,
      database,
      user,
      password,
      supabase_url,
      supabase_anon_key,
      supabase_service_role_key,
      ssl_mode,
      pool_max: Number(pool_max) || 20,
      idle_timeout_ms: Number(idle_timeout_ms) || 30000,
      connection_timeout_ms: Number(connection_timeout_ms) || 10000,
      is_active
    });

    const liveHealth = await db.testDatabaseConnectivity();

    await logAuditEvent({
      admin: auth,
      action: 'supabase_configuration_updated',
      entity: 'system_settings',
      entityId: 'supabase_conf',
      beforeState,
      afterState: saved,
      result: liveHealth.status !== 'error' ? 'success' : 'warning',
      req
    });

    return NextResponse.json({
      success: true,
      message: 'Supabase PostgreSQL configuration saved successfully.',
      config: saved,
      liveHealth
    });
  } catch (error: any) {
    console.error('Save Supabase config error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save Supabase configuration' }, { status: 500 });
  }
}
