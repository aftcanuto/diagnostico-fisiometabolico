import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const KEEPALIVE_TABLES = ['clinicas', 'pacientes', 'avaliacoes'] as const;

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return json({ ok: false, error: 'CRON_SECRET nao configurado' }, 503);
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return json({ ok: false, error: 'Nao autorizado' }, 401);
  }

  const admin = createAdminClient();
  const checks = await Promise.all(
    KEEPALIVE_TABLES.map(async (table) => {
      const { error } = await admin.from(table).select('id', { head: true }).limit(1);
      return { table, error };
    }),
  );
  const failedCheck = checks.find(({ error }) => error);

  if (failedCheck) {
    console.error(
      `[supabase-keepalive] Falha ao consultar ${failedCheck.table}: ${failedCheck.error.message}`,
    );
    return json({ ok: false, error: 'Falha ao consultar o Supabase' }, 503);
  }

  return json({ ok: true, checkedAt: new Date().toISOString() });
}
