import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const TABELAS_PERMITIDAS = new Set([
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
]);

async function getUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function usuarioPodeAcessarAvaliacao(userId: string, avaliacaoId: string) {
  const supabase = createClient();
  const { data: avaliacaoVisivel } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('id', avaliacaoId)
    .maybeSingle();

  if (avaliacaoVisivel?.id) return true;

  const admin = createAdminClient();
  const { data: avaliacao, error: erroAvaliacao } = await admin
    .from('avaliacoes')
    .select('id, clinica_id, avaliador_id, paciente_id')
    .eq('id', avaliacaoId)
    .maybeSingle();

  if (erroAvaliacao || !avaliacao) return false;
  if (avaliacao.avaliador_id === userId) return true;

  if (avaliacao.clinica_id) {
    const { data: membro, error: erroMembro } = await admin
      .from('clinica_membros')
      .select('id')
      .eq('clinica_id', avaliacao.clinica_id)
      .eq('user_id', userId)
      .eq('ativo', true)
      .maybeSingle();

    if (!erroMembro && !!membro) return true;
  }

  if (!avaliacao.paciente_id) return false;
  const { data: paciente, error: erroPaciente } = await admin
    .from('pacientes')
    .select('avaliador_id, clinica_id')
    .eq('id', avaliacao.paciente_id)
    .maybeSingle();

  if (erroPaciente || !paciente) return false;
  if (paciente.avaliador_id === userId) return true;

  if (!paciente.clinica_id) return false;
  const { data: membroPaciente, error: erroMembroPaciente } = await admin
    .from('clinica_membros')
    .select('id')
    .eq('clinica_id', paciente.clinica_id)
    .eq('user_id', userId)
    .eq('ativo', true)
    .maybeSingle();

  return !erroMembroPaciente && !!membroPaciente;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const tabela = req.nextUrl.searchParams.get('tabela') ?? '';
  const avaliacaoId = req.nextUrl.searchParams.get('avaliacaoId') ?? '';
  if (!TABELAS_PERMITIDAS.has(tabela) || !avaliacaoId) {
    return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
  }

  const permitido = await usuarioPodeAcessarAvaliacao(userId, avaliacaoId);
  if (!permitido) return NextResponse.json({ error: 'Sem permissao para esta avaliacao' }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(tabela)
    .select('*')
    .eq('avaliacao_id', avaliacaoId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const { tabela, avaliacaoId, payload } = await req.json();
  if (!TABELAS_PERMITIDAS.has(tabela) || !avaliacaoId || typeof payload !== 'object' || !payload) {
    return NextResponse.json({ error: 'Parametros invalidos' }, { status: 400 });
  }

  const permitido = await usuarioPodeAcessarAvaliacao(userId, avaliacaoId);
  if (!permitido) return NextResponse.json({ error: 'Sem permissao para esta avaliacao' }, { status: 403 });

  const admin = createAdminClient();
  let payloadSeguro = { ...payload };
  let error: any = null;

  for (let tentativa = 0; tentativa < 8; tentativa += 1) {
    const result = await admin
      .from(tabela)
      .upsert({ avaliacao_id: avaliacaoId, ...payloadSeguro }, { onConflict: 'avaliacao_id' });

    error = result.error;
    if (!error) break;

    const msg = error.message ?? '';
    const coluna =
      msg.match(/Could not find the '([^']+)' column/)?.[1] ??
      msg.match(/column "([^"]+)" of relation/)?.[1];

    if (!coluna || !(coluna in payloadSeguro)) break;
    delete payloadSeguro[coluna];
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
