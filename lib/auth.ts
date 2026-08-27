import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { query } from './db';
import { AdminUser } from './types';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'crm-automation-super-secure-key-32chars-min';
const SECRET_BYTES = new TextEncoder().encode(JWT_SECRET_KEY);
const COOKIE_NAME = 'crm_admin_token';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'operator';
}

/**
 * Sign JWT session token
 */
export async function signToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_BYTES);
}

/**
 * Verify JWT session token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_BYTES);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function authenticateAdmin(emailOrUsername: string, passwordPlain: string): Promise<AdminUser | null> {
  const normalized = emailOrUsername.trim().toLowerCase();
  const raw = emailOrUsername.trim();
  const res = await query<{
    id: string;
    email: string;
    name: string;
    role: 'superadmin' | 'admin' | 'operator';
    password_hash: string;
    created_at: string;
    updated_at: string;
  }>('SELECT * FROM public.admin_users WHERE LOWER(email) = $1 OR email = $2 LIMIT 1', [normalized, raw]);

  if (res.rows.length === 0) return null;

  const user = res.rows[0];
  let isValid = false;

  // 1. If stored hash is bcrypt
  if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
    try {
      isValid = await bcrypt.compare(passwordPlain, user.password_hash);
      if (!isValid) {
        const crypto = await import('crypto');
        const md5Input = crypto.createHash('md5').update(passwordPlain).digest('hex');
        isValid = await bcrypt.compare(md5Input, user.password_hash);
      }
    } catch {}
  } else {
    // 2. Stored hash is MD5 or plaintext hex
    const crypto = await import('crypto');
    const md5Input = crypto.createHash('md5').update(passwordPlain).digest('hex').toLowerCase();
    const storedHash = user.password_hash.trim().toLowerCase();
    const inputClean = passwordPlain.trim().toLowerCase();

    isValid = (storedHash === inputClean) || (storedHash === md5Input);
  }

  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

/**
 * Get current session user from request headers / cookies
 */
export async function getCurrentAdmin(req?: NextRequest): Promise<TokenPayload | null> {
  let token = '';

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      const cookie = req.cookies.get(COOKIE_NAME);
      token = cookie ? cookie.value : '';
    }
  } else {
    try {
      const cookieStore = cookies();
      const cookie = cookieStore.get(COOKIE_NAME);
      token = cookie ? cookie.value : '';
    } catch {
      token = '';
    }
  }

  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Server-Side Route Guard for Admin API endpoints
 * Throws NextResponse if unauthorized, or returns authenticated admin
 */
export async function requireAdmin(
  req: NextRequest,
  allowedRoles: Array<'superadmin' | 'admin' | 'operator'> = ['superadmin', 'admin', 'operator']
): Promise<TokenPayload | NextResponse> {
  const admin = await getCurrentAdmin(req);

  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication is required.' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(admin.role)) {
    return NextResponse.json(
      { error: `Forbidden. Role '${admin.role}' does not have sufficient privileges for this action.` },
      { status: 403 }
    );
  }

  return admin;
}

/**
 * Set HTTP-Only Session Cookie
 */
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

/**
 * Clear Session Cookie
 */
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}
