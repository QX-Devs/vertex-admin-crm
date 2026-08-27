import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { testN8nConnectivity } from '@/lib/n8nService';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const config = await db.getN8nConfig();
    const liveTest = await testN8nConnectivity();

    return NextResponse.json({
      config,
      liveTest
    });
  } catch (error: any) {
    console.error('Fetch n8n config error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch n8n configuration' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      base_url,
      webhook_validate_url,
      webhook_inbound_url,
      api_key,
      webhook_verify_token,
      ssl_reject_unauthorized,
      timeout_ms,
      is_active
    } = body;

    const beforeState = await db.getN8nConfig();

    const saved = await db.saveN8nConfig({
      base_url,
      webhook_validate_url,
      webhook_inbound_url,
      api_key,
      webhook_verify_token,
      ssl_reject_unauthorized,
      timeout_ms,
      is_active
    });

    const liveTest = await testN8nConnectivity();

    await logAuditEvent({
      admin: auth,
      action: 'n8n_configuration_updated',
      entity: 'system_settings',
      entityId: 'n8n_conf',
      beforeState,
      afterState: saved,
      result: liveTest.reachable ? 'success' : 'warning',
      req
    });

    return NextResponse.json({
      success: true,
      message: 'n8n configuration saved successfully.',
      config: saved,
      liveTest
    });
  } catch (error: any) {
    console.error('Save n8n config error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save n8n configuration' }, { status: 500 });
  }
}
