import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    let notifications = await db.getNotifications(limit);
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.is_read);
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
