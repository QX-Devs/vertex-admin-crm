import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { verifyChannelWithN8n } from '@/lib/n8nService';
import { ChannelType } from '@/lib/types';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
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

    const client = await db.getClientById(client_id);
    if (!client) {
      return NextResponse.json({ error: `Client '${client_id}' not found.` }, { status: 404 });
    }

    const integration = await db.getIntegrationByClientAndPlatform(client_id, platform as ChannelType);
    const externalAccountId = integration?.external_account_id || client.channel_account_id || '';

    if (!externalAccountId) {
      return NextResponse.json(
        { error: `No registered account ID found for ${platform} on client '${client_id}'.` },
        { status: 400 }
      );
    }

    // Execute live n8n verification
    const verification = await verifyChannelWithN8n({
      platform: platform as ChannelType,
      clientId: client_id,
      externalAccountId,
      credentials: {
        phoneNumberId: integration?.whatsapp_phone_number_id || externalAccountId,
        pageId: integration?.facebook_page_id || externalAccountId,
        instagramAccountId: integration?.instagram_account_id || externalAccountId,
        wabaId: integration?.waba_id
      }
    });

    await logAuditEvent({
      admin: auth,
      action: 'channel_n8n_verified',
      entity: 'integration',
      entityId: `${client_id}:${platform}`,
      afterState: { verification_id: verification.n8n_confirmation_id, status: verification.n8n_status },
      result: verification.success ? 'success' : 'failure',
      req
    });

    return NextResponse.json(verification);
  } catch (error: any) {
    console.error('n8n verification route error:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify channel with n8n' }, { status: 500 });
  }
}
