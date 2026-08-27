import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { testN8nConnectivity } from '@/lib/n8nService';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      base_url,
      webhook_validate_url,
      webhook_inbound_url,
      api_key,
      timeout_ms
    } = body;

    const testResult = await testN8nConnectivity({
      base_url,
      webhook_validate_url,
      webhook_inbound_url,
      api_key,
      timeout_ms
    });

    return NextResponse.json(testResult);
  } catch (error: any) {
    console.error('Test n8n connectivity error:', error);
    return NextResponse.json({ error: error.message || 'Failed to test n8n connectivity' }, { status: 500 });
  }
}
