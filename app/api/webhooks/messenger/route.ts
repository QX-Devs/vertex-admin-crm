import { NextRequest, NextResponse } from 'next/server';
import { processMultiTenantWebhookMessage } from '@/lib/webhookProcessor';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'meta_crm_verify_token_2026';

/**
 * Facebook Messenger Webhook Verification (Meta GET challenge)
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
 * Facebook Messenger Multi-Tenant Ingestion (Meta POST events)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.object !== 'page') {
      return NextResponse.json({ status: 'ignored_non_page' }, { status: 200 });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const pageId = entry.id; // Facebook Page ID receiving the message
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

      for (const event of messaging) {
        if (event.message?.is_echo) continue; // Skip echo messages

        const senderId = event.sender?.id || '';
        const text = event.message?.text || event.postback?.title || event.postback?.payload || '';
        const messageId = event.message?.mid || event.postback?.mid || `fb_${senderId}_${Date.now()}`;
        const messageType = event.message?.attachments ? (event.message.attachments[0]?.type || 'attachment') : 'text';

        if (pageId && senderId) {
          await processMultiTenantWebhookMessage({
            platform: 'messenger',
            externalAccountId: pageId,
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
    console.error('Messenger webhook ingestion error:', error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
