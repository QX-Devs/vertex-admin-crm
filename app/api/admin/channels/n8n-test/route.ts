import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { executeN8nPipelineTest } from '@/lib/n8nService';
import { ChannelType } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { client_id, platform, test_message, customer_id } = body;

    if (!client_id || !platform) {
      return NextResponse.json(
        { error: 'client_id and platform are required.' },
        { status: 400 }
      );
    }

    const client = await db.getClientById(client_id);
    if (!client) {
      return NextResponse.json({ error: `Client '${client_id}' not found.` }, { status: 404 });
    }

    const testResult = await executeN8nPipelineTest({
      clientId: client_id,
      platform: platform as ChannelType,
      testMessage: test_message,
      customerId: customer_id
    });

    await logAuditEvent({
      admin: auth,
      action: 'channel_n8n_pipeline_tested',
      entity: 'integration',
      entityId: `${client_id}:${platform}`,
      afterState: { execution_id: testResult.execution_id, duration_ms: testResult.total_duration_ms },
      result: 'success',
      req
    });

    return NextResponse.json(testResult);
  } catch (error: any) {
    console.error('n8n test route error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute n8n test message' }, { status: 500 });
  }
}
