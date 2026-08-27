const fs = require('fs');
const path = require('path');

function ensureAndWrite(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Wrote:', filePath);
}

// 1. app/api/admin/clients/[id]/route.ts
ensureAndWrite('app/api/admin/clients/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const client = await db.getClientById(params.id);
    if (!client) {
      return NextResponse.json({ error: \`Client '\${params.id}' not found\` }, { status: 404 });
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
    const { clientUpdates, settingsUpdates } = body;

    const result = await db.updateClient(params.id, clientUpdates || {}, settingsUpdates);
    if (!result) {
      return NextResponse.json({ error: \`Client '\${params.id}' not found\` }, { status: 404 });
    }

    await logAuditEvent({
      admin: auth,
      action: clientUpdates?.status ? \`client_status_changed_to_\${clientUpdates.status}\` : 'client_updated',
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
`);

// 2. app/api/admin/conversations/route.ts
ensureAndWrite('app/api/admin/conversations/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const clientId = url.searchParams.get('clientId') || undefined;
  const channel = url.searchParams.get('channel') || undefined;
  const customerId = url.searchParams.get('customerId') || undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const conversations = await db.getConversations({ clientId, channel, customerId, search });
    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error('Conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
`);

// 3. app/api/admin/leads/route.ts
ensureAndWrite('app/api/admin/leads/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const clientId = url.searchParams.get('clientId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const leads = await db.getLeads({ clientId, status, search });
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
`);

// 4. app/api/admin/leads/[id]/route.ts
ensureAndWrite('app/api/admin/leads/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: \`Lead '\${params.id}' not found\` }, { status: 404 });
    }

    await logAuditEvent({
      admin: auth,
      action: 'lead_updated',
      entity: 'lead',
      entityId: params.id,
      beforeState: result.before,
      afterState: result.lead,
      result: 'success',
      req
    });

    return NextResponse.json({ success: true, lead: result.lead });
  } catch (error: any) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update lead' }, { status: 500 });
  }
}
`);

// 5. app/api/admin/orders/route.ts
ensureAndWrite('app/api/admin/orders/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const clientId = url.searchParams.get('clientId') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const orders = await db.getLeads({ clientId, status, confirmedOnly: true, search });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
`);

// 6. app/api/admin/orders/[id]/route.ts
ensureAndWrite('app/api/admin/orders/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: \`Order '\${params.id}' not found\` }, { status: 404 });
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
`);

// 7. app/api/admin/plans/route.ts
ensureAndWrite('app/api/admin/plans/route.ts', `import { NextRequest, NextResponse } from 'next/server';
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
`);

// 8. app/api/admin/plans/[id]/route.ts
ensureAndWrite('app/api/admin/plans/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: \`Plan '\${params.id}' not found\` }, { status: 404 });
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

    return NextResponse.json({ success: true, message: \`Plan '\${params.id}' deleted successfully.\` });
  } catch (error: any) {
    console.error('Delete plan error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete plan' }, { status: 400 });
  }
}
`);

// 9. app/api/admin/usage/route.ts
ensureAndWrite('app/api/admin/usage/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = await db.getDashboardStats();
    return NextResponse.json(stats.usage);
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage analytics' }, { status: 500 });
  }
}
`);

// 10. app/api/admin/integrations/route.ts
ensureAndWrite('app/api/admin/integrations/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const integrations = await db.getIntegrations();
    return NextResponse.json(integrations);
  } catch (error: any) {
    console.error('Integrations error:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}
`);

// 11. app/api/admin/audit-log/route.ts
ensureAndWrite('app/api/admin/audit-log/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit')) || 100;

  try {
    const logs = await db.getAuditLogs(limit);
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Audit log error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
`);

// 12. app/api/admin/health/route.ts
ensureAndWrite('app/api/admin/health/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query, db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatency = 0;

  try {
    await query('SELECT 1');
    dbLatency = Date.now() - startTime;
  } catch (err: any) {
    dbStatus = 'degraded';
  }

  const integrations = await db.getIntegrations();
  const failedIntegrations = integrations.filter(i => ['INVALID_CREDENTIALS', 'EXPIRED', 'WEBHOOK_ERROR', 'API_ERROR'].includes(i.status));

  return NextResponse.json({
    status: failedIntegrations.length > 0 ? 'warning' : 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      driver: process.env.DATABASE_URL ? 'PostgreSQL' : 'Embedded Engine'
    },
    services: {
      n8n: {
        status: 'active',
        webhookUrl: '/webhook/admin/channel/validate',
        verifiedEndpoints: 4
      },
      metaApi: {
        status: failedIntegrations.some(i => i.platform === 'instagram' && i.status === 'EXPIRED') ? 'warning' : 'operational',
        connectedChannels: integrations.filter(i => i.status === 'CONNECTED').length,
        totalChannels: integrations.length
      }
    },
    alerts: failedIntegrations.map(f => ({
      platform: f.platform,
      client_id: f.client_id,
      status: f.status,
      error: f.last_error
    }))
  });
}
`);

console.log('All API route files written successfully!');
