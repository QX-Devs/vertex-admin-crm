import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const report = await db.getSchemaIntegrityReport();
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Fetch schema integrity report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to inspect schema integrity' }, { status: 500 });
  }
}
