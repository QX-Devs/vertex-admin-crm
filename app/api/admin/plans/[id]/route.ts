import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const existing = await db.getPlanById(params.id);
    if (!existing) {
      return NextResponse.json({ error: `Plan '${params.id}' not found` }, { status: 404 });
    }

    const updated = await db.savePlan({ ...existing, ...body, plan_id: params.id }, false);

    await logAuditEvent({
      admin: auth,
      action: 'plan_updated',
      entity: 'plan',
      entityId: params.id,
      beforeState: existing,
      afterState: updated,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    console.error('Update plan error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update plan' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req, ['superadmin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const deleted = await db.deletePlan(params.id);

    await logAuditEvent({
      admin: auth,
      action: 'plan_deleted',
      entity: 'plan',
      entityId: params.id,
      beforeState: deleted,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, message: `Plan '${params.id}' deleted successfully.` });
  } catch (error: any) {
    console.error('Delete plan error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete plan' }, { status: 400 });
  }
}
