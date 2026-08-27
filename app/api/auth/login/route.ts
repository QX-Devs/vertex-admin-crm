import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, signToken, setAuthCookie } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = await signToken({
      userId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

    setAuthCookie(response, token);

    await logAuditEvent({
      admin: { userId: admin.id, email: admin.email, name: admin.name, role: admin.role },
      action: 'admin_login',
      entity: 'auth',
      entityId: admin.id,
      afterState: { email: admin.email, role: admin.role },
      result: 'success',
      req
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
