import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { host, port, database, user } = body;

    const result = await db.testDatabaseConnectivity({
      host,
      port: Number(port) || 5432,
      database,
      user
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test Supabase connectivity error:', error);
    return NextResponse.json({ error: error.message || 'Failed to test database connectivity' }, { status: 500 });
  }
}
