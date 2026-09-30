import { NextRequest, NextResponse } from 'next/server';
import { calcIdade } from '@/lib/calculations/antropometria';
import { launchPdfBrowser } from '@/lib/pdf/browser';
import { renderEvolutionReportHTML } from '@/lib/pdf/evolution-template';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { anthropometryAnalysisUsable } from '@/lib/anthropometry-record';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const flat = (value: any) => Array.isArray(value) ? value[0] : value;

export async function GET(request: NextRequest) {
  const pacienteId = request.nextUrl.searchParams.get('pacienteId');
  if (!pacienteId) return NextResponse.json({ error: 'pacienteId required' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: pacientePermitido } = await supabase
    .from('pacientes')
    .select('id')
    .eq('id', pacienteId)
    .maybeSingle();
  if (!pacientePermitido) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const admin = createAdminClient();
  const { data: paciente, error: pacienteError } = await admin
    .from('pacientes')
    .select('*')
    .eq('id', pacienteId)
    .single();
  if (pacienteError || !paciente) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { data: avaliacoesBase, error: avaliacoesError } = await admin
    .from('avaliacoes')
    .select(`
      id, data, tipo, status, clinica_id, avaliador_id, modulos_selecionados,
      fonte_gordura_relatorio, percentual_gordura_relatorio,
      scores(*), antropometria(*), forca(*), cardiorrespiratorio(*),
      posturografia(*), termografia(*), jump_test(*), sinais_vitais(*), anamnese(*)
    `)
    .eq('paciente_id', pacienteId)
    .eq('status', 'finalizada')
    .order('data', { ascending: true });

  if (avaliacoesError) {
    return NextResponse.json({ error: avaliacoesError.message }, { status: 400 });
  }
  if (!avaliacoesBase || avaliacoesBase.length < 2) {
    return NextResponse.json({ error: 'São necessárias ao menos duas avaliações finalizadas' }, { status: 422 });
  }

  const ids = avaliacoesBase.map((avaliacao: any) => avaliacao.id);
  const ultima = avaliacoesBase[avaliacoesBase.length - 1] as any;
  const [
    { data: bioimpedancias },
    { data: flexibilidades },
    { data: rmls },
    { data: analiseEvolucao },
    { data: clinica },
    { data: avaliador },
  ] = await Promise.all([
    admin.from('bioimpedancia').select('*').in('avaliacao_id', ids),
    admin.from('flexibilidade').select('*').in('avaliacao_id', ids),
    admin.from('rml').select('*').in('avaliacao_id', ids),
    admin
      .from('analises_ia')
      .select('conteudo, texto_editado, conteudo_paciente, texto_paciente_editado')
      .eq('avaliacao_id', ultima.id)
      .eq('tipo', 'evolucao')
      .maybeSingle(),
    ultima.clinica_id
      ? admin.from('clinicas').select('nome, logo_url, cor_primaria, telefone, email').eq('id', ultima.clinica_id).maybeSingle()
      : Promise.resolve({ data: null }),
    ultima.avaliador_id
      ? admin.from('avaliadores').select('nome, crefito_crm').eq('id', ultima.avaliador_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!analiseEvolucao?.texto_editado?.trim() || !anthropometryAnalysisUsable({ ...analiseEvolucao, tipo: 'evolucao' }, flat(ultima.antropometria))) {
    return NextResponse.json(
      { error: 'Revise e salve a análise de evolução antes de gerar o relatório.' },
      { status: 409 },
    );
  }

  const mapByEvaluation = (rows: any[] | null) => Object.fromEntries((rows ?? []).map(row => [row.avaliacao_id, row]));
  const bioMap = mapByEvaluation(bioimpedancias);
  const flexMap = mapByEvaluation(flexibilidades);
  const rmlMap = mapByEvaluation(rmls);
  const avaliacoes = avaliacoesBase.map((avaliacao: any) => ({
    ...avaliacao,
    scores: flat(avaliacao.scores),
    antropometria: flat(avaliacao.antropometria),
    forca: flat(avaliacao.forca),
    cardiorrespiratorio: flat(avaliacao.cardiorrespiratorio),
    posturografia: flat(avaliacao.posturografia),
    termografia: flat(avaliacao.termografia),
    jump_test: flat(avaliacao.jump_test),
    sinais_vitais: flat(avaliacao.sinais_vitais),
    anamnese: flat(avaliacao.anamnese),
    bioimpedancia: bioMap[avaliacao.id] ?? null,
    flexibilidade: flexMap[avaliacao.id] ?? null,
    rml: rmlMap[avaliacao.id] ?? null,
  }));

  const html = renderEvolutionReportHTML({
    clinica,
    paciente: {
      nome: paciente.nome,
      cpf: paciente.cpf,
      sexo: paciente.sexo,
      idade: calcIdade(paciente.data_nascimento),
    },
    avaliador: {
      nome: avaliador?.nome ?? user.email?.split('@')[0] ?? 'Avaliador',
      conselho: avaliador?.crefito_crm ?? null,
    },
    avaliacoes,
    analiseEvolucao,
  });

  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    const safeName = paciente.nome.replace(/[^\p{L}\p{N}]+/gu, '_');
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="evolucao-${safeName}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
