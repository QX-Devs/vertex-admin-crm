import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { processMultiTenantWebhookMessage } from '@/lib/webhookProcessor';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { platform, external_account_id, customer_id, message_text, message_type = 'text' } = body;

    if (!platform || !external_account_id || !customer_id || !message_text) {
      return NextResponse.json(
        { error: 'platform, external_account_id, customer_id, and message_text are required.' },
        { status: 400 }
      );
    }

    const result = await processMultiTenantWebhookMessage({
      platform,
      externalAccountId: external_account_id,
      customerId: customer_id,
      messageId: `test_${Date.now()}`,
      messageText: message_text,
      messageType: message_type,
      timestamp: String(Date.now())
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Webhook test router error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
