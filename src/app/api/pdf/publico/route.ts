import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { renderLaudoHTML } from '@/lib/pdf/template';
import { calcIdade } from '@/lib/calculations/antropometria';
import { launchPdfBrowser } from '@/lib/pdf/browser';
import { prepararPaginacaoLaudo } from '@/lib/pdf/pagination';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type PerfilAvaliador = {
  nome?: string | null;
  crefito_crm?: string | null;
  especialidade?: string | null;
};

function nomeAvaliadorGenerico(nome?: string | null) {
  const n = (nome ?? '').trim().toLowerCase();
  if (!n) return true;
  return ['avaliador', 'medico', 'médico', 'fict', 'exemplo', 'fulano', 'teste'].some((termo) => n.includes(termo));
}

function escolherAvaliador(principal?: PerfilAvaliador | null, fallback?: PerfilAvaliador | null) {
  const fonte = !nomeAvaliadorGenerico(principal?.nome)
    ? principal
    : !nomeAvaliadorGenerico(fallback?.nome)
      ? fallback
      : principal ?? fallback ?? {};
  const escolhido = fonte ?? {};

  return {
    nome: escolhido.nome?.trim() || 'Avaliador',
    conselho: escolhido.crefito_crm ?? null,
    especialidade: escolhido.especialidade ?? null,
  };
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const avaliacaoId = req.nextUrl.searchParams.get('avaliacaoId');
  if (!token || !avaliacaoId) return NextResponse.json({ error: 'params' }, { status: 400 });

  const supabase = createAdminClient();

  const { data: tok } = await supabase.from('paciente_tokens')
    .select('*').eq('token', token).eq('revogado', false)
    .gt('expira_em', new Date().toISOString()).maybeSingle();
  if (!tok) return NextResponse.json({ error: 'link inválido' }, { status: 403 });

  const { data: aval } = await supabase.from('avaliacoes')
    .select('*, pacientes(*)').eq('id', avaliacaoId).single();
  if (!aval || aval.paciente_id !== tok.paciente_id) {
    return NextResponse.json({ error: 'acesso negado' }, { status: 403 });
  }

  const [anamnese, sinais_vitais, posturografia, bioimpedancia, antropometria, forca, flexibilidade, rml, cardio, biomecanica, scoresRow, avaliadorToken, avaliadorAvaliacao, clinica, analises] = await Promise.all([
    supabase.from('anamnese').select('*, anamnese_templates(campos)').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('sinais_vitais').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('posturografia').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('bioimpedancia').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('antropometria').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('forca').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('flexibilidade').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('rml').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('cardiorrespiratorio').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('biomecanica_corrida').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('scores').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    supabase.from('avaliadores').select('nome, crefito_crm, especialidade').eq('id', tok.avaliador_id).maybeSingle(),
    supabase.from('avaliadores').select('nome, crefito_crm, especialidade').eq('id', aval.avaliador_id).maybeSingle(),
    aval.clinica_id ? supabase.from('clinicas').select('*').eq('id', aval.clinica_id).single() : Promise.resolve({ data: null }),
    supabase.from('analises_ia').select('tipo, conteudo, texto_editado').eq('avaliacao_id', avaliacaoId),
  ]);

  const analisesMap: Record<string, any> = {};
  (analises.data ?? []).forEach((a: any) => {
    analisesMap[a.tipo] = { ...a.conteudo, texto_editado: a.texto_editado };
  });

  const dadosLaudo = {
    clinica: clinica.data,
    paciente: {
      nome: aval.pacientes.nome, sexo: aval.pacientes.sexo,
      data_nascimento: aval.pacientes.data_nascimento,
      idade: calcIdade(aval.pacientes.data_nascimento),
      cpf: aval.pacientes.cpf ?? null,
    },
    avaliador: escolherAvaliador(avaliadorAvaliacao.data, avaliadorToken.data),
    avaliacao: { data: aval.data, tipo: aval.tipo },
    modulos: aval.modulos_selecionados,
    dados: {
      anamnese: anamnese.data ? { ...anamnese.data, _campos: (anamnese.data as any)?.anamnese_templates?.campos ?? [] } : null, sinais_vitais: sinais_vitais.data,
      posturografia: posturografia.data, bioimpedancia: bioimpedancia.data,
      antropometria: antropometria.data,
      forca: forca.data, flexibilidade: flexibilidade.data, rml: rml.data, cardiorrespiratorio: cardio.data, biomecanica_corrida: biomecanica.data,
    },
    scores: scoresRow.data ?? {
      global: null, postura: null, composicao_corporal: null, forca: null, cardiorrespiratorio: null,
    },
    analisesIA: analisesMap,
  };

  const html = renderLaudoHTML(dadosLaudo);

  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await prepararPaginacaoLaudo(page);
    const pdf = await page.pdf({
      format: 'A4', printBackground: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="laudo-${aval.pacientes.nome.replace(/\s+/g, '_')}-${aval.data}.pdf"`,
      },
    });
  } finally { await browser.close(); }
}
