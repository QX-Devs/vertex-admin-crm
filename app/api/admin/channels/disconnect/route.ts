import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { ChannelType } from '@/lib/types';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { client_id, platform } = body;

    if (!client_id || !platform) {
      return NextResponse.json(
        { error: 'client_id and platform are required.' },
        { status: 400 }
      );
    }

    const existing = await db.getIntegrationByClientAndPlatform(client_id, platform as ChannelType);
    if (!existing) {
      return NextResponse.json(
        { error: `No channel integration found for client '${client_id}' on platform '${platform}'.` },
        { status: 404 }
      );
    }

    const disconnected = await db.disconnectChannelIntegration(client_id, platform as ChannelType);

    await logAuditEvent({
      admin: auth,
      action: 'channel_disconnected',
      entity: 'integration',
      entityId: `${client_id}:${platform}`,
      beforeState: existing,
      afterState: disconnected,
      result: 'success',
      req
    });

    return NextResponse.json({
      success: true,
      message: 'Channel disconnected successfully and credentials revoked.',
      integration: disconnected
    });
  } catch (error: any) {
    console.error('Disconnect channel error:', error);
    return NextResponse.json({ error: error.message || 'Failed to disconnect channel' }, { status: 500 });
  }
}
