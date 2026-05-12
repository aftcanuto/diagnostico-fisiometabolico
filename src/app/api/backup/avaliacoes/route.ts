import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { montarCsv } from '@/lib/backup/avaliacoesCsv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODULOS = [
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
] as const;

type ModuloTabela = (typeof MODULOS)[number];
type AvaliacaoBackup = {
  id: string;
  paciente_id?: string | null;
  avaliador_id?: string | null;
  data?: string | null;
  status?: string | null;
  tipo?: string | null;
  modulos_selecionados?: unknown;
  created_at?: string | null;
  updated_at?: string | null;
};
type PacienteBackup = {
  id: string;
  nome?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
};
type AvaliadorBackup = {
  id: string;
  nome?: string | null;
  crefito_crm?: string | null;
  especialidade?: string | null;
};

function indexarPorAvaliacao(rows: any[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.avaliacao_id, row]));
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sessao expirada' }, { status: 401 });

  const [{ data: clinicaId }, { data: papel }] = await Promise.all([
    supabase.rpc('current_clinica_id'),
    supabase.rpc('current_papel'),
  ]);

  if (!clinicaId) return NextResponse.json({ error: 'Clinica nao identificada' }, { status: 400 });
  if (!['owner', 'admin'].includes(papel ?? '')) {
    return NextResponse.json({ error: 'Apenas administradores podem exportar o backup' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: avaliacoes, error: avaliacoesError } = await admin
    .from('avaliacoes')
    .select('*')
    .eq('clinica_id', clinicaId)
    .order('data', { ascending: false });

  if (avaliacoesError) {
    return NextResponse.json({ error: avaliacoesError.message }, { status: 400 });
  }

  const avaliacoesRows = (avaliacoes ?? []) as AvaliacaoBackup[];
  const ids = avaliacoesRows.map((avaliacao) => avaliacao.id);
  const pacienteIds = Array.from(new Set(avaliacoesRows.map((avaliacao) => avaliacao.paciente_id).filter(Boolean)));
  const avaliadorIds = Array.from(new Set(avaliacoesRows.map((avaliacao) => avaliacao.avaliador_id).filter(Boolean)));

  const [
    pacientesRes,
    avaliadoresRes,
    scoresRes,
    analisesRes,
    ...modulosRes
  ] = await Promise.all([
    pacienteIds.length
      ? admin.from('pacientes').select('id,nome,sexo,data_nascimento,cpf,email,telefone').in('id', pacienteIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    avaliadorIds.length
      ? admin.from('avaliadores').select('id,nome,crefito_crm,especialidade').in('id', avaliadorIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    ids.length
      ? admin.from('scores').select('*').in('avaliacao_id', ids)
      : Promise.resolve({ data: [] as any[], error: null }),
    ids.length
      ? admin.from('analises_ia').select('avaliacao_id,tipo,conteudo,texto_editado,conteudo_paciente,texto_paciente_editado,plano_acao').in('avaliacao_id', ids)
      : Promise.resolve({ data: [] as any[], error: null }),
    ...MODULOS.map((tabela) => (
      ids.length
        ? admin.from(tabela).select('*').in('avaliacao_id', ids)
        : Promise.resolve({ data: [] as any[], error: null })
    )),
  ]);

  const erros = [
    pacientesRes.error,
    avaliadoresRes.error,
    scoresRes.error,
    analisesRes.error,
    ...modulosRes.map((res) => res.error),
  ].filter(Boolean);

  if (erros.length) {
    return NextResponse.json({ error: erros[0]?.message ?? 'Falha ao montar backup' }, { status: 400 });
  }

  const pacientes = new Map<string, PacienteBackup>((pacientesRes.data ?? []).map((row: PacienteBackup) => [row.id, row]));
  const avaliadores = new Map<string, AvaliadorBackup>((avaliadoresRes.data ?? []).map((row: AvaliadorBackup) => [row.id, row]));
  const scores = indexarPorAvaliacao(scoresRes.data);
  const analises = new Map<string, any[]>();
  for (const analise of analisesRes.data ?? []) {
    const atual = analises.get(analise.avaliacao_id) ?? [];
    atual.push(analise);
    analises.set(analise.avaliacao_id, atual);
  }

  const modulos = new Map<ModuloTabela, Map<string, any>>();
  MODULOS.forEach((tabela, idx) => modulos.set(tabela, indexarPorAvaliacao(modulosRes[idx]?.data)));

  const linhas = avaliacoesRows.map((avaliacao) => {
    const paciente = avaliacao.paciente_id ? pacientes.get(avaliacao.paciente_id) : undefined;
    const avaliador = avaliacao.avaliador_id ? avaliadores.get(avaliacao.avaliador_id) : undefined;
    const score = scores.get(avaliacao.id) ?? {};

    return {
      avaliacao_id: avaliacao.id,
      data_avaliacao: avaliacao.data,
      status: avaliacao.status,
      tipo: avaliacao.tipo,
      paciente_id: avaliacao.paciente_id,
      paciente_nome: paciente?.nome ?? '',
      paciente_sexo: paciente?.sexo ?? '',
      paciente_nascimento: paciente?.data_nascimento ?? '',
      paciente_cpf: paciente?.cpf ?? '',
      paciente_email: paciente?.email ?? '',
      paciente_telefone: paciente?.telefone ?? '',
      avaliador_id: avaliacao.avaliador_id,
      avaliador_nome: avaliador?.nome ?? '',
      avaliador_registro: avaliador?.crefito_crm ?? '',
      avaliador_especialidade: avaliador?.especialidade ?? '',
      modulos_selecionados: avaliacao.modulos_selecionados ?? {},
      score_global: score.global ?? '',
      score_postura: score.postura ?? '',
      score_composicao_corporal: score.composicao_corporal ?? '',
      score_forca: score.forca ?? '',
      score_flexibilidade: score.flexibilidade ?? '',
      score_rml: score.rml ?? '',
      score_cardiorrespiratorio: score.cardiorrespiratorio ?? '',
      anamnese: modulos.get('anamnese')?.get(avaliacao.id) ?? '',
      sinais_vitais: modulos.get('sinais_vitais')?.get(avaliacao.id) ?? '',
      posturografia: modulos.get('posturografia')?.get(avaliacao.id) ?? '',
      bioimpedancia: modulos.get('bioimpedancia')?.get(avaliacao.id) ?? '',
      antropometria: modulos.get('antropometria')?.get(avaliacao.id) ?? '',
      flexibilidade: modulos.get('flexibilidade')?.get(avaliacao.id) ?? '',
      forca: modulos.get('forca')?.get(avaliacao.id) ?? '',
      rml: modulos.get('rml')?.get(avaliacao.id) ?? '',
      cardiorrespiratorio: modulos.get('cardiorrespiratorio')?.get(avaliacao.id) ?? '',
      biomecanica_corrida: modulos.get('biomecanica_corrida')?.get(avaliacao.id) ?? '',
      analises_ia: analises.get(avaliacao.id) ?? [],
      criado_em: avaliacao.created_at ?? '',
      atualizado_em: avaliacao.updated_at ?? '',
    };
  });

  const headers = [
    'avaliacao_id',
    'data_avaliacao',
    'status',
    'tipo',
    'paciente_id',
    'paciente_nome',
    'paciente_sexo',
    'paciente_nascimento',
    'paciente_cpf',
    'paciente_email',
    'paciente_telefone',
    'avaliador_id',
    'avaliador_nome',
    'avaliador_registro',
    'avaliador_especialidade',
    'modulos_selecionados',
    'score_global',
    'score_postura',
    'score_composicao_corporal',
    'score_forca',
    'score_flexibilidade',
    'score_rml',
    'score_cardiorrespiratorio',
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
    'analises_ia',
    'criado_em',
    'atualizado_em',
  ];

  const csv = montarCsv(headers, linhas);
  const data = new Date().toISOString().slice(0, 10);
  const filename = `backup-avaliacoes-${data}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'x-backup-filename': filename,
      'Cache-Control': 'no-store',
    },
  });
}
