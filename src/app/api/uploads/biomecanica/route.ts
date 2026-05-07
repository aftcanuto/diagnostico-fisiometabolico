import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function getUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function usuarioPodeAcessarAvaliacao(userId: string, avaliacaoId: string) {
  const supabase = createClient();
  const { data: visivel } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('id', avaliacaoId)
    .maybeSingle();
  if (visivel?.id) return true;

  const admin = createAdminClient();
  const { data: avaliacao } = await admin
    .from('avaliacoes')
    .select('id, avaliador_id, clinica_id')
    .eq('id', avaliacaoId)
    .maybeSingle();
  if (!avaliacao) return false;
  if (avaliacao.avaliador_id === userId) return true;
  if (!avaliacao.clinica_id) return false;

  const { data: membro } = await admin
    .from('clinica_membros')
    .select('id')
    .eq('clinica_id', avaliacao.clinica_id)
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle();
  return !!membro;
}

async function garantirBucketBiomecanica(admin: any) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) return { error: listError };

  const existe = Array.isArray(buckets) && buckets.some((bucket: any) => bucket?.id === 'biomecanica' || bucket?.name === 'biomecanica');
  if (existe) return { error: null };

  const { error } = await admin.storage.createBucket('biomecanica', {
    public: true,
    fileSizeLimit: 10485760,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (!error || error.message?.toLowerCase?.().includes('already exists')) return { error: null };
  return { error };
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const form = await req.formData();
  const avaliacaoId = String(form.get('avaliacaoId') ?? '');
  const key = String(form.get('key') ?? 'grafico');
  const file = form.get('file');
  if (!avaliacaoId || !(file instanceof File)) {
    return NextResponse.json({ error: 'Arquivo invalido' }, { status: 400 });
  }

  const permitido = await usuarioPodeAcessarAvaliacao(userId, avaliacaoId);
  if (!permitido) return NextResponse.json({ error: 'Sem permissao para esta avaliacao' }, { status: 403 });

  const admin = createAdminClient();
  const { error: bucketError } = await garantirBucketBiomecanica(admin);
  if (bucketError) return NextResponse.json({ error: bucketError.message ?? 'Nao foi possivel preparar o bucket de biomecanica' }, { status: 400 });

  const bucket = admin.storage.from('biomecanica');
  const ext = file.name.split('.').pop() || 'png';
  const safeKey = key.replace(/[^a-z0-9_-]/gi, '');
  const path = `${userId}/${avaliacaoId}/${safeKey}-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await bucket.upload(path, bytes, {
    contentType: file.type || 'image/png',
    upsert: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data } = bucket.getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
