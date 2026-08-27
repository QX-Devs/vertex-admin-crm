import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { id, all } = body;

    if (all) {
      const count = await db.markAllNotificationsAsRead();
      return NextResponse.json({ success: true, markedCount: count });
    }

    if (id) {
      const success = await db.markNotificationAsRead(id);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'id or all is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
