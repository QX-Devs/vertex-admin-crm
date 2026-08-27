import { NextRequest } from 'next/server';
import { db } from './db';
import { TokenPayload } from './auth';

export interface AuditParams {
  admin: TokenPayload;
  action: string;
  entity: string;
  entityId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  result?: 'success' | 'failure' | 'warning';
  req?: NextRequest;
}

/**
 * Remove sensitive credentials and secret keys before logging
 */
function sanitizeForAudit(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForAudit);

  const clean: Record<string, any> = {};
  const secretKeys = ['password', 'password_hash', 'token', 'access_token', 'secret', 'app_secret', 'credential_reference'];

  for (const [k, v] of Object.entries(obj)) {
    if (secretKeys.some(sk => k.toLowerCase().includes(sk))) {
      clean[k] = '[REDACTED_SECRET]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitizeForAudit(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export async function logAuditEvent({
  admin,
  action,
  entity,
  entityId,
  beforeState = null,
  afterState = null,
  result = 'success',
  req
}: AuditParams) {
  const ip = req ? (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1') : '127.0.0.1';
  const userAgent = req ? (req.headers.get('user-agent') || 'system') : 'system';

  try {
    await db.addAuditLog({
      admin_user_id: admin.userId,
      admin_email: admin.email,
      action,
      entity,
      entity_id: entityId,
      before_state: sanitizeForAudit(beforeState),
      after_state: sanitizeForAudit(afterState),
      result,
      ip_address: ip,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Failed to record audit log:', error);
  }
}
