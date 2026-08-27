import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get('since') || undefined;

    const deltas = await db.getRealtimeDeltas(since);
    const integrations = await db.getIntegrations();

    return NextResponse.json({
      ...deltas,
      integrations,
      connectedWhatsApp: integrations.filter(i => i.platform === 'whatsapp' && i.status === 'CONNECTED').length,
      connectedFacebook: integrations.filter(i => i.platform === 'messenger' && i.status === 'CONNECTED').length,
      connectedInstagram: integrations.filter(i => i.platform === 'instagram' && i.status === 'CONNECTED').length,
      serverTime: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Realtime deltas error:', error);
    return NextResponse.json({ error: 'Failed to fetch realtime operations deltas' }, { status: 500 });
  }
}
