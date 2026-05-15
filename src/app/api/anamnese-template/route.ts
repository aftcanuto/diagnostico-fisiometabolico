import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getUserId, usuarioPodeAcessarAvaliacao } from '@/lib/api/permissions';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const avaliacaoId = req.nextUrl.searchParams.get('avaliacaoId') ?? '';
  const templateId = req.nextUrl.searchParams.get('templateId') ?? '';
  if (!avaliacaoId) return NextResponse.json({ error: 'Avaliacao invalida' }, { status: 400 });

  if (!(await usuarioPodeAcessarAvaliacao(userId, avaliacaoId))) {
    return NextResponse.json({ error: 'Sem permissao para esta avaliacao' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: avaliacao } = await admin
    .from('avaliacoes')
    .select('id,clinica_id')
    .eq('id', avaliacaoId)
    .maybeSingle();

  if (!avaliacao?.clinica_id) return NextResponse.json({ data: null });

  if (templateId) {
    const { data: salvo } = await admin
      .from('anamnese_templates')
      .select('id,nome,campos,ativo,padrao')
      .eq('id', templateId)
      .eq('clinica_id', avaliacao.clinica_id)
      .maybeSingle();

    if (salvo) return NextResponse.json({ data: salvo });
  }

  const { data: padrao } = await admin
    .from('anamnese_templates')
    .select('id,nome,campos,ativo,padrao')
    .eq('clinica_id', avaliacao.clinica_id)
    .eq('padrao', true)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (padrao) return NextResponse.json({ data: padrao });

  const { data: ativo } = await admin
    .from('anamnese_templates')
    .select('id,nome,campos,ativo,padrao')
    .eq('clinica_id', avaliacao.clinica_id)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (ativo) return NextResponse.json({ data: ativo });

  const { data: qualquer } = await admin
    .from('anamnese_templates')
    .select('id,nome,campos,ativo,padrao')
    .eq('clinica_id', avaliacao.clinica_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ data: qualquer ?? null });
}
