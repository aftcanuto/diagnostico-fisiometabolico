import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { MIGRATIONS_ESPERADAS, ULTIMA_MIGRATION_ESPERADA } from '@/lib/system/migrations';

export const dynamic = 'force-dynamic';

const TABELAS_CRITICAS = [
  'clinicas',
  'clinica_membros',
  'pacientes',
  'avaliacoes',
  'scores',
  'analises_ia',
  'pdf_config',
  'consentimento_modelos',
  'consentimento_aceites',
  'paciente_tokens',
  'prontuario_eventos',
];

const BUCKETS_CRITICOS = ['posturografia', 'branding', 'biomecanica', 'produto-imagens'];

const ENVS_CRITICAS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'NEXT_PUBLIC_APP_URL',
];

async function countRows(admin: any, table: string) {
  const { count, error } = await admin
    .from(table)
    .select('id', { count: 'exact', head: true });

  return {
    table,
    ok: !error,
    count: count ?? null,
    error: error?.message ?? null,
  };
}

function envStatus() {
  return ENVS_CRITICAS.map((name) => ({
    name,
    ok: Boolean(process.env[name]),
  }));
}

async function pdfStatus() {
  try {
    await import('@/lib/pdf/browser');
    return { ok: true, message: 'Gerador de PDF carregado' };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? 'Falha ao carregar gerador de PDF' };
  }
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const { data: papel } = await supabase.rpc('current_papel');
  if (papel !== 'owner' && papel !== 'admin') {
    return NextResponse.json({ error: 'Sem permissao' }, { status: 403 });
  }

  const admin = createAdminClient();

  const tabelas = await Promise.all(TABELAS_CRITICAS.map((table) => countRows(admin, table)));
  const bancoOk = tabelas.every((table) => table.ok);

  const { data: bucketsData, error: bucketsError } = await admin.storage.listBuckets();
  const bucketIds = (bucketsData ?? []).map((bucket: any) => bucket.id);
  const buckets = BUCKETS_CRITICOS.map((bucket) => ({
    bucket,
    ok: bucketIds.includes(bucket),
  }));

  const { data: aplicadas, error: migrationsError } = await admin
    .from('sistema_migrations_aplicadas')
    .select('nome, aplicada_em, origem')
    .order('nome', { ascending: true });

  const aplicadasSet = new Set((aplicadas ?? []).map((item: any) => item.nome));
  const faltantes = migrationsError
    ? MIGRATIONS_ESPERADAS
    : MIGRATIONS_ESPERADAS.filter((migration) => !aplicadasSet.has(migration));
  const ultimaAplicada = (aplicadas ?? []).at(-1)?.nome ?? null;

  const envs = envStatus();
  const pdf = await pdfStatus();
  const ia = {
    ok: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL),
    model: process.env.ANTHROPIC_MODEL || null,
  };

  const checks = {
    banco: bancoOk,
    storage: !bucketsError && buckets.every((bucket) => bucket.ok),
    ia: ia.ok,
    pdf: pdf.ok,
    env: envs.every((env) => env.ok),
    migrations: !migrationsError && faltantes.length === 0,
  };

  return NextResponse.json({
    ok: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    checks,
    banco: { ok: bancoOk, tabelas },
    storage: {
      ok: !bucketsError && buckets.every((bucket) => bucket.ok),
      buckets,
      error: bucketsError?.message ?? null,
    },
    ia,
    pdf,
    env: envs,
    migrations: {
      ok: !migrationsError && faltantes.length === 0,
      ultimaEsperada: ULTIMA_MIGRATION_ESPERADA,
      ultimaAplicada,
      aplicadas: aplicadas?.length ?? 0,
      esperadas: MIGRATIONS_ESPERADAS.length,
      faltantes,
      error: migrationsError?.message ?? null,
    },
  });
}
