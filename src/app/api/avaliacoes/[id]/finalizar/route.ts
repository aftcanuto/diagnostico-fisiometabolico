import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { data: visivel } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();

  const admin = createAdminClient();
  if (!visivel?.id) {
    const { data: avaliacao } = await admin
      .from('avaliacoes')
      .select('id, avaliador_id, clinica_id')
      .eq('id', params.id)
      .maybeSingle();

    if (!avaliacao) return NextResponse.json({ error: 'Avaliacao nao encontrada' }, { status: 404 });
    if (avaliacao.avaliador_id !== user.id && avaliacao.clinica_id) {
      const { data: membro } = await admin
        .from('clinica_membros')
        .select('id')
        .eq('clinica_id', avaliacao.clinica_id)
        .eq('user_id', user.id)
        .eq('ativo', true)
        .maybeSingle();
      if (!membro) return NextResponse.json({ error: 'Sem permissao para esta avaliacao' }, { status: 403 });
    }
  }

  const { error } = await admin
    .from('avaliacoes')
    .update({ status: 'finalizada' })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
