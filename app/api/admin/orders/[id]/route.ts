import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const result = await db.updateLead(params.id, body);
    if (!result) {
      return NextResponse.json({ error: `Order '${params.id}' not found` }, { status: 404 });
    }

    await logAuditEvent({
      admin: auth,
      action: 'order_status_updated',
      entity: 'order',
      entityId: params.id,
      beforeState: result.before,
      afterState: result.lead,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, order: result.lead });
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
