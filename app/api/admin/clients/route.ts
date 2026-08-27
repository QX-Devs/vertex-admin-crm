import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const clients = await db.getClients();
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Clients fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      client_id,
      business_name,
      channel_account_id,
      channel = 'whatsapp',
      plan_id = 'starter',
      owner_phone = '',
      owner_email = '',
      reply_tone = 'Professional, friendly, accurate',
      service_type = 'General',
      timezone = 'UTC',
      language = 'en'
    } = body;

    if (!client_id || !business_name || !channel_account_id) {
      return NextResponse.json(
        { error: 'client_id, business_name, and channel_account_id are required.' },
        { status: 400 }
      );
    }

    const existing = await db.getClientById(client_id);
    if (existing) {
      return NextResponse.json({ error: `Client '${client_id}' already exists.` }, { status: 409 });
    }

    const newClient = {
      client_id,
      business_name,
      channel_account_id,
      channel,
      status: 'active' as const,
      plan_id,
      owner_phone,
      owner_email,
      reply_tone,
      service_type,
      timezone,
      storage_destination: 'postgres' as const,
      crm_webhook_url: '',
      language,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const client = await db.createClient(newClient);

    await logAuditEvent({
      admin: auth,
      action: 'client_created',
      entity: 'client',
      entityId: client_id,
      afterState: newClient,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    console.error('Create client error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 });
  }
}
