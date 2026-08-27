import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || undefined;

    const integrations = await db.getIntegrations(clientId);
    return NextResponse.json(integrations);
  } catch (error: any) {
    console.error('Fetch channels error:', error);
    return NextResponse.json({ error: 'Failed to fetch channel integrations' }, { status: 500 });
  }
}
