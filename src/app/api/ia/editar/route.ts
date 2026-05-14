import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { usuarioPodeAcessarAvaliacao } from '@/lib/api/permissions';

export const runtime = 'nodejs';

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
  if (planoAcao !== undefined) payload.plano_acao = planoAcao;
  payload.revisado_por = user.id;
  payload.revisado_em = new Date().toISOString();

  const admin = createAdminClient();
  const { error } = await admin
    .from('analises_ia')
    .upsert(payload, { onConflict: 'avaliacao_id,tipo' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
