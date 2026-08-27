import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { confirmConnectionWithN8n } from '@/lib/n8nService';
import { ChannelType } from '@/lib/types';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      platform,
      client_id,
      external_account_id,
      external_account_name,
      facebook_page_id,
      instagram_account_id,
      whatsapp_phone_number_id,
      waba_id,
      access_token,
      webhook_status = 'Verified'
    } = body;

    if (!platform || !client_id || !external_account_id) {
      return NextResponse.json(
        { error: 'platform, client_id, and external_account_id are required.' },
        { status: 400 }
      );
    }

    const client = await db.getClientById(client_id);
    if (!client) {
      return NextResponse.json({ error: `Client '${client_id}' not found.` }, { status: 404 });
    }

    const existing = await db.getIntegrationByClientAndPlatform(client_id, platform as ChannelType);
    const isReconnect = existing && existing.status === 'CONNECTED';

    // Generate protected server vault token reference hash (Rule 5: No plaintext tokens exposed)
    const tokenHash = access_token
      ? `vault_meta_${crypto.createHash('sha256').update(access_token).digest('hex').slice(0, 24)}`
      : `vault_ref_${Date.now()}`;

    // Confirm & Sign with n8n Automation Engine
    const n8nReceipt = await confirmConnectionWithN8n({
      clientId: client_id,
      platform: platform as ChannelType,
      externalAccountId: external_account_id,
      externalAccountName: external_account_name
    });

    const integration = await db.connectChannelIntegration({
      clientId: client_id,
      platform: platform as ChannelType,
      externalAccountId: external_account_id,
      externalAccountName: external_account_name,
      facebookPageId: facebook_page_id,
      instagramAccountId: instagram_account_id,
      whatsappPhoneNumberId: whatsapp_phone_number_id,
      wabaId: waba_id,
      credentialTokenHash: tokenHash,
      webhookStatus: webhook_status,
      metadata: {
        n8n_confirmed: true,
        n8n_confirmation_id: n8nReceipt.confirmation_id,
        n8n_confirmed_at: n8nReceipt.confirmed_at,
        n8n_status: n8nReceipt.n8n_status
      }
    });

    await logAuditEvent({
      admin: auth,
      action: isReconnect ? 'channel_reconnected_n8n_confirmed' : 'channel_connected_n8n_confirmed',
      entity: 'integration',
      entityId: `${client_id}:${platform}`,
      beforeState: existing || undefined,
      afterState: integration,
      result: 'success',
      req
    });

    return NextResponse.json({
      success: true,
      n8n_confirmed: true,
      n8n_receipt: n8nReceipt,
      message: isReconnect
        ? 'Channel reconnected and confirmed with n8n successfully.'
        : 'Channel successfully connected and confirmed by n8n Automation Engine.',
      integration
    });
  } catch (error: any) {
    console.error('Connect channel error:', error);
    return NextResponse.json({ error: error.message || 'Failed to connect channel' }, { status: 500 });
  }
}
