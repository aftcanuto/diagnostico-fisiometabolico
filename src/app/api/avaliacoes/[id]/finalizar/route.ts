import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function validarAcesso(userId: string, avaliacaoId: string) {
  const supabase = createClient();
  const { data: visivel } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('id', avaliacaoId)
    .maybeSingle();

  const admin = createAdminClient();
  if (!visivel?.id) {
    const { data: avaliacao } = await admin
      .from('avaliacoes')
      .select('id, avaliador_id, clinica_id')
      .eq('id', avaliacaoId)
      .maybeSingle();

    if (!avaliacao) return { ok: false as const, status: 404, error: 'Avaliacao nao encontrada' };
    if (avaliacao.avaliador_id !== userId && avaliacao.clinica_id) {
      const { data: membro } = await admin
        .from('clinica_membros')
        .select('id')
        .eq('clinica_id', avaliacao.clinica_id)
        .eq('user_id', userId)
        .eq('ativo', true)
        .maybeSingle();
      if (!membro) return { ok: false as const, status: 403, error: 'Sem permissao para esta avaliacao' };
    }
  }
  return { ok: true as const };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const acesso = await validarAcesso(user.id, params.id);
  if (!acesso.ok) return NextResponse.json({ error: acesso.error }, { status: acesso.status });

  const body = await req.json().catch(() => ({}));
  const payload: Record<string, any> = {};
  if (body.checklistFinalizacao !== undefined) payload.checklist_finalizacao = body.checklistFinalizacao;
  if (body.checklistAlertasConfirmados !== undefined) {
    payload.checklist_alertas_confirmados = !!body.checklistAlertasConfirmados;
  }
  if (!Object.keys(payload).length) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { error } = await admin.from('avaliacoes').update(payload).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const acesso = await validarAcesso(user.id, params.id);
  if (!acesso.ok) return NextResponse.json({ error: acesso.error }, { status: acesso.status });

  const body = await req.json().catch(() => ({}));
  const payload: Record<string, any> = { status: 'finalizada' };
  if (body.checklistFinalizacao !== undefined) payload.checklist_finalizacao = body.checklistFinalizacao;
  if (body.checklistAlertasConfirmados !== undefined) {
    payload.checklist_alertas_confirmados = !!body.checklistAlertasConfirmados;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('avaliacoes')
    .update(payload)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
