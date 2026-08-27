import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const plans = await db.getPlans();
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Plans error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { plan_id, name, monthly_chat_limit } = body;

    if (!plan_id || !name || !monthly_chat_limit) {
      return NextResponse.json({ error: 'plan_id, name, and monthly_chat_limit are required.' }, { status: 400 });
    }

    const created = await db.savePlan(body, true);

    await logAuditEvent({
      admin: auth,
      action: 'plan_created',
      entity: 'plan',
      entityId: plan_id,
      afterState: created,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, plan: created }, { status: 201 });
  } catch (error: any) {
    console.error('Create plan error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create plan' }, { status: 500 });
  }
}
