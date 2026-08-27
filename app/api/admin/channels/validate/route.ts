import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { validateMetaCredentials } from '@/lib/channelValidator';
import { ChannelType } from '@/lib/types';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { platform, client_id, credentials } = body;

    if (!platform || !['whatsapp', 'messenger', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Invalid platform. Supported platforms: whatsapp, messenger, instagram.' },
        { status: 400 }
      );
    }

    if (!client_id) {
      return NextResponse.json(
        { success: false, error: 'client_id is required for validation.' },
        { status: 400 }
      );
    }

    if (!credentials || typeof credentials !== 'object') {
      return NextResponse.json(
        { success: false, error: 'credentials object is required.' },
        { status: 400 }
      );
    }

    // Call live validator (Rule 5: Credentials never returned or logged)
    const result = await validateMetaCredentials({
      platform: platform as ChannelType,
      clientId: client_id,
      credentials
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Validation route error:', error.message);
    return NextResponse.json(
      { success: false, token_valid: false, webhook_ready: false, error: error.message || 'Connection check failed' },
      { status: 500 }
    );
  }
}
