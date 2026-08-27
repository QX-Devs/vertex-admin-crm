import { NextRequest, NextResponse } from 'next/server';
import { processMultiTenantWebhookMessage } from '@/lib/webhookProcessor';

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'meta_crm_verify_token_2026';

/**
 * WhatsApp Webhook Verification Endpoint (Meta GET challenge)
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
 * WhatsApp Multi-Tenant Ingestion (Meta POST events)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored_non_whatsapp' }, { status: 200 });
    }

    const entries = Array.isArray(body.entry) ? body.entry : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const val = change.value || {};
        const phoneNumberId = val.metadata?.phone_number_id || '';
        const messages = Array.isArray(val.messages) ? val.messages : [];

        for (const msg of messages) {
          const from = msg.from || '';
          const text = msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || '';
          const msgType = msg.type || 'text';
          const messageId = msg.id || `wa_${Date.now()}`;

          if (phoneNumberId && from) {
            await processMultiTenantWebhookMessage({
              platform: 'whatsapp',
              externalAccountId: phoneNumberId,
              customerId: from,
              fromPhone: from,
              messageId,
              messageText: text,
              messageType: msgType,
              timestamp: msg.timestamp || String(Date.now()),
              rawEvent: msg
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: true }, { status: 200 });
  } catch (error: any) {
    console.error('WhatsApp webhook ingestion error:', error);
    return NextResponse.json({ error: 'Internal webhook error' }, { status: 500 });
  }
}
