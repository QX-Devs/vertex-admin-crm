import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie, getCurrentAdmin } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin(req);
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  clearAuthCookie(response);

  if (admin) {
    await logAuditEvent({
      admin,
      action: 'admin_logout',
      entity: 'auth',
      entityId: admin.userId,
      result: 'success',
      req
    });
  }

  return response;
}
