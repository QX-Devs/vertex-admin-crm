import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const clientId = url.searchParams.get('clientId') || undefined;
  const channel = url.searchParams.get('channel') || undefined;
  const customerId = url.searchParams.get('customerId') || undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const conversations = await db.getConversations({ clientId, channel, customerId, search });
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
