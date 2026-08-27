import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const tables = await db.getDatabaseTablesInfo();
    return NextResponse.json({ tables });
  } catch (error: any) {
    console.error('Fetch database tables error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch database tables' }, { status: 500 });
  }
}
