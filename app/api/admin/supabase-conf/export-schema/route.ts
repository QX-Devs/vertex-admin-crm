import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, ['superadmin', 'admin', 'operator']);
  if (auth instanceof NextResponse) return auth;

  try {
    const migrationsDir = path.join(process.cwd(), 'lib', 'migrations');
    let fullSql = `-- Supabase Schema Export Generated at ${new Date().toISOString()}\n\n`;

    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).sort();
      for (const file of files) {
        if (file.endsWith('.sql')) {
          fullSql += `-- ========================================================\n`;
          fullSql += `-- Migration: ${file}\n`;
          fullSql += `-- ========================================================\n`;
          fullSql += fs.readFileSync(path.join(migrationsDir, file), 'utf8') + '\n\n';
        }
      }
    }

    return new NextResponse(fullSql, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="supabase_schema_full.sql"'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to export schema' }, { status: 500 });
  }
}
