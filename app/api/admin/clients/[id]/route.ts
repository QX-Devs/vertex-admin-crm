import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const client = await db.getClientById(params.id);
    if (!client) {
      return NextResponse.json({ error: `Client '${params.id}' not found` }, { status: 404 });
    }
    return NextResponse.json(client);
  } catch (error: any) {
    console.error('Client detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { clientUpdates, settingsUpdates, resetConfig } = body;

    if (resetConfig) {
      const resetSettings = await db.resetClientConfig(params.id);
      if (!resetSettings) {
        return NextResponse.json({ error: `Client '${params.id}' not found` }, { status: 404 });
      }

      await logAuditEvent({
        admin: auth,
        action: 'client_config_reset_to_defaults',
        entity: 'client',
        entityId: params.id,
        afterState: resetSettings,
        result: 'success',
        req
      });

      return NextResponse.json({ success: true, settings: resetSettings });
    }

    const result = await db.updateClient(params.id, clientUpdates || {}, settingsUpdates);
    if (!result) {
      return NextResponse.json({ error: `Client '${params.id}' not found` }, { status: 404 });
    }

    await logAuditEvent({
      admin: auth,
      action: clientUpdates?.status ? `client_status_changed_to_${clientUpdates.status}` : 'client_updated',
      entity: 'client',
      entityId: params.id,
      beforeState: result.before,
      afterState: result.client,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, client: result.client });
  } catch (error: any) {
    console.error('Client update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
  }
}


