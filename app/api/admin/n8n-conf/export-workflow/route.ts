import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const wfPath = path.join(process.cwd(), 'workflow.json');
    if (!fs.existsSync(wfPath)) {
      return NextResponse.json({ error: 'workflow.json file not found' }, { status: 404 });
    }

    const content = fs.readFileSync(wfPath, 'utf8');
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="workflow.json"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to export workflow' }, { status: 500 });
  }
}
