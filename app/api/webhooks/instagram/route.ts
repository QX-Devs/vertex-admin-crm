import { NextRequest, NextResponse } from 'next/server';
import { processMultiTenantWebhookMessage } from '@/lib/webhookProcessor';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'meta_crm_verify_token_2026';

/**
 * Instagram Webhook Verification (Meta GET challenge)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * Instagram Direct Multi-Tenant Ingestion (Meta POST events)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.object !== 'instagram') {
      return NextResponse.json({ status: 'ignored_non_instagram' }, { status: 200 });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const igAccountId = entry.id; // Instagram Professional Account ID
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

      for (const event of messaging) {
        if (event.message?.is_echo) continue;

        const senderId = event.sender?.id || '';
        const text = event.message?.text || event.postback?.title || event.postback?.payload || '';
        const messageId = event.message?.mid || event.postback?.mid || `ig_${senderId}_${Date.now()}`;
        const messageType = event.message?.attachments ? (event.message.attachments[0]?.type || 'attachment') : 'text';

        if (igAccountId && senderId) {
          await processMultiTenantWebhookMessage({
            platform: 'instagram',
            externalAccountId: igAccountId,
            customerId: senderId,
            messageId,
            messageText: text,
            messageType,
            timestamp: String(event.timestamp || Date.now()),
            rawEvent: event
          });
        }
      }
    }

    return NextResponse.json({ success: true, processed: true }, { status: 200 });
  } catch (error: any) {
    console.error('Instagram webhook ingestion error:', error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
