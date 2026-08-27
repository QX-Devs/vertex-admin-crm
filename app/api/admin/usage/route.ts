import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await db.getDashboardStats();
    return NextResponse.json(stats.usage);
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage analytics' }, { status: 500 });
  }
}
