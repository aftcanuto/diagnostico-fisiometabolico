import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { gerarAnaliseModulo, gerarConclusaoGlobal, gerarAnaliseEvolucao, type TipoAnalise } from '@/lib/ai/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: clinicaId } = await supabase.rpc('current_clinica_id');
  if (!clinicaId) return NextResponse.json({ error: 'sem clínica' }, { status: 403 });

  const { data: clinica } = await supabase.from('clinicas')
    .select('ia_habilitada, ativa').eq('id', clinicaId).single();
  if (!clinica?.ia_habilitada || !clinica?.ativa) {
    return NextResponse.json({ error: 'IA não habilitada para sua clínica' }, { status: 403 });
  }

  const body = await req.json();
  const { avaliacaoId } = body;
  const tipo = body.tipo ?? body.modulo;
  if (!avaliacaoId || !tipo) return NextResponse.json({ error: 'parâmetros faltando' }, { status: 400 });

  const { error: acessoError } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('id', avaliacaoId)
    .eq('clinica_id', clinicaId)
    .single();

  if (acessoError) {
    return NextResponse.json({ error: 'sem permissao para esta avaliacao' }, { status: 403 });
  }

  try {
    let conteudo: any;
    if (tipo === 'conclusao_global') conteudo = await gerarConclusaoGlobal(avaliacaoId);
    else if (tipo === 'evolucao')    conteudo = await gerarAnaliseEvolucao(avaliacaoId);
    else                             conteudo = await gerarAnaliseModulo(avaliacaoId, tipo as TipoAnalise);
    return NextResponse.json({ ok: true, conteudo });
  } catch (err: any) {
    console.error('Erro IA:', err);
    const status = err?.code === 'CLAUDE_MODEL_UNAVAILABLE' ? 400 : 500;
    return NextResponse.json({ error: err.message ?? 'Erro ao gerar análise' }, { status });
  }
}
