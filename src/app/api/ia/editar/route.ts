import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { usuarioPodeAcessarAvaliacao } from '@/lib/api/permissions';

export const runtime = 'nodejs';
const CAMPOS_IA = 'tipo, conteudo, texto_editado, conteudo_paciente, texto_paciente_editado, plano_acao, modelo_ia, gerado_em';
const CAMPOS_IA_LEGADO = 'tipo, conteudo, texto_editado, conteudo_paciente, texto_paciente_editado, modelo_ia, gerado_em';

function colunaPlanoAcaoAusente(error: any) {
  const mensagem = String(error?.message ?? '');
  return /plano_acao/i.test(mensagem) && /(column|schema cache|could not find)/i.test(mensagem);
}

const TIPOS_IA = new Set([
  'anamnese',
  'sinais_vitais',
  'posturografia',
  'bioimpedancia',
  'antropometria',
  'flexibilidade',
  'forca',
  'rml',
  'cardiorrespiratorio',
  'biomecanica_corrida',
  'conclusao_global',
  'evolucao',
]);

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const avaliacaoId = req.nextUrl.searchParams.get('avaliacaoId');
  if (!avaliacaoId) {
    return NextResponse.json({ error: 'avaliacaoId obrigatorio' }, { status: 400 });
  }

  const permitido = await usuarioPodeAcessarAvaliacao(user.id, avaliacaoId);
  if (!permitido) {
    return NextResponse.json({ error: 'sem permissao para esta avaliacao' }, { status: 403 });
  }

  const admin = createAdminClient();
  let { data, error } = await admin
    .from('analises_ia')
    .select(CAMPOS_IA)
    .eq('avaliacao_id', avaliacaoId);

  if (error && colunaPlanoAcaoAusente(error)) {
    const legado = await admin
      .from('analises_ia')
      .select(CAMPOS_IA_LEGADO)
      .eq('avaliacao_id', avaliacaoId);
    data = legado.data?.map((item: any) => ({
      ...item,
      plano_acao: item.conteudo?.plano_acao ?? null,
    })) ?? null;
    error = legado.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { avaliacaoId, tipo, conteudo, textoEditado, conteudoPaciente, textoPacienteEditado, planoAcao } = await req.json();
  if (!avaliacaoId || !tipo || !TIPOS_IA.has(tipo)) {
    return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 });
  }

  const permitido = await usuarioPodeAcessarAvaliacao(user.id, avaliacaoId);
  if (!permitido) {
    return NextResponse.json({ error: 'sem permissao para esta avaliacao' }, { status: 403 });
  }

  const payload: any = { avaliacao_id: avaliacaoId, tipo };
  if (conteudo !== undefined) payload.conteudo = conteudo;
  if (textoEditado !== undefined) payload.texto_editado = textoEditado;
  if (conteudoPaciente !== undefined) payload.conteudo_paciente = conteudoPaciente;
  if (textoPacienteEditado !== undefined) payload.texto_paciente_editado = textoPacienteEditado;
  if (planoAcao !== undefined) payload.plano_acao = typeof planoAcao === 'string' ? { texto: planoAcao } : planoAcao;
  payload.revisado_por = user.id;
  payload.revisado_em = new Date().toISOString();

  const admin = createAdminClient();
  let { error } = await admin
    .from('analises_ia')
    .upsert(payload, { onConflict: 'avaliacao_id,tipo' });

  if (error && planoAcao !== undefined && colunaPlanoAcaoAusente(error)) {
    const { data: existente } = await admin
      .from('analises_ia')
      .select('conteudo')
      .eq('avaliacao_id', avaliacaoId)
      .eq('tipo', tipo)
      .maybeSingle();

    const payloadLegado = {
      ...payload,
      conteudo: {
        ...((existente?.conteudo && typeof existente.conteudo === 'object') ? existente.conteudo : {}),
        plano_acao: payload.plano_acao,
      },
    };
    delete payloadLegado.plano_acao;

    const tentativaLegada = await admin
      .from('analises_ia')
      .upsert(payloadLegado, { onConflict: 'avaliacao_id,tipo' });
    error = tentativaLegada.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
