import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
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

function escolherAvaliador(principal?: PerfilAvaliador | null, fallback?: PerfilAvaliador | null, email?: string | null) {
  const fonte = !nomeAvaliadorGenerico(principal?.nome)
    ? principal
    : !nomeAvaliadorGenerico(fallback?.nome)
      ? fallback
      : principal ?? fallback ?? {};
  const escolhido = fonte ?? {};

  return {
    nome: escolhido.nome?.trim() || email?.split('@')[0] || 'Avaliador',
    conselho: escolhido.crefito_crm ?? null,
    especialidade: escolhido.especialidade ?? null,
  };
}

export async function GET(req: NextRequest) {
  const avaliacaoId = req.nextUrl.searchParams.get('avaliacaoId');
  if (!avaliacaoId) return NextResponse.json({ error: 'avaliacaoId required' }, { status: 400 });

  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { data: aval, error: avalErr } = await supabase
      .from('avaliacoes')
      .select('*, pacientes(*)')
      .eq('id', avaliacaoId)
      .single();

    if (avalErr || !aval) {
      console.error('[PDF] Avaliação não encontrada:', avalErr);
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const admin = createAdminClient();

    // Buscar todos os módulos em paralelo
    const [
      anamnese, sinais_vitais, posturografia, bioimpedancia,
      antropometria, forca, flexibilidade, rml, cardio, biomecanica,
      scoresRow, avaliador, clinica, analises,
    ] = await Promise.all([
      admin.from('anamnese').select('*, anamnese_templates(campos)').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('sinais_vitais').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('posturografia').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('bioimpedancia').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('antropometria').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('forca').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('flexibilidade').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('rml').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('cardiorrespiratorio').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('biomecanica_corrida').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('scores').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
      admin.from('avaliadores').select('nome, crefito_crm, especialidade').eq('id', aval.avaliador_id).maybeSingle(),
      aval.clinica_id
        ? admin.from('clinicas').select('*').eq('id', aval.clinica_id).single()
        : Promise.resolve({ data: null, error: null }),
      admin.from('analises_ia').select('tipo, conteudo, texto_editado').eq('avaliacao_id', avaliacaoId),
    ]);

    // pdf_config separado — tabela pode ainda não existir se migration 013 não foi aplicada
    let pdfConfigData: any = null;
    if (aval.clinica_id) {
      try {
        const { data } = await admin
          .from('pdf_config')
          .select('*')
          .eq('clinica_id', aval.clinica_id)
          .maybeSingle();
        pdfConfigData = data;
      } catch {
        console.warn('[PDF] pdf_config indisponível — usando defaults');
      }
    }

    // Mapa de análises IA
    const analisesMap: Record<string, any> = {};
    (analises.data ?? []).forEach((a: any) => {
      analisesMap[a.tipo] = { ...a.conteudo, texto_editado: a.texto_editado };
    });

    // Renderizar HTML
    const dadosLaudo = {
      clinica: clinica.data,
      paciente: {
        nome: aval.pacientes.nome,
        sexo: aval.pacientes.sexo,
        data_nascimento: aval.pacientes.data_nascimento,
        idade: calcIdade(aval.pacientes.data_nascimento),
        cpf: aval.pacientes.cpf ?? null,
      },
      avaliador: escolherAvaliador(avaliador.data, null, user.email),
      avaliacao: { data: aval.data, tipo: aval.tipo },
      modulos: aval.modulos_selecionados,
      dados: {
        anamnese: anamnese.data ? { ...anamnese.data, _campos: (anamnese.data as any)?.anamnese_templates?.campos ?? [] } : null,
        sinais_vitais: sinais_vitais.data,
        posturografia: posturografia.data,
        bioimpedancia: bioimpedancia.data,
        antropometria: antropometria.data,
        forca: forca.data,
        flexibilidade: flexibilidade.data,
        rml: rml.data,
        cardiorrespiratorio: cardio.data,
        biomecanica_corrida: biomecanica.data,
      },
      scores: scoresRow.data ?? {
        global: null, postura: null,
        composicao_corporal: null, forca: null,
        flexibilidade: null, rml: null, cardiorrespiratorio: null,
      },
      analisesIA: analisesMap,
      pdfConfig: pdfConfigData ?? null,
    };

    const html = renderLaudoHTML(dadosLaudo);

    const browser = await launchPdfBrowser();

    try {
      const page = await browser.newPage();

      page.on('pageerror', err => console.error('[PDF] Erro na página:', err));
      page.on('console', msg => {
        if (msg.type() === 'error') console.error('[PDF] Console error:', msg.text());
      });

      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      await prepararPaginacaoLaudo(page);

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="laudo-${aval.pacientes.nome.replace(/\s+/g, '_')}-${aval.data}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }

  } catch (err: any) {
    console.error('[PDF] Erro interno:', err?.message ?? err);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF', detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
