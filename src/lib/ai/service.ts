/**
 * Orquestração de análises de IA. Persiste em analises_ia e registra uso.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { llmCall, parseJSON } from './client';
import * as P from './prompts';
import type { PacienteContexto } from './prompts';

export type TipoAnalise =
  | 'anamnese' | 'sinais_vitais' | 'posturografia'
  | 'antropometria' | 'bioimpedancia' | 'forca' | 'flexibilidade'
  | 'rml' | 'cardiorrespiratorio' | 'biomecanica_corrida'
  | 'conclusao_global' | 'evolucao';

async function carregarContexto(avaliacaoId: string) {
  const sb = createAdminClient();
  const { data: aval } = await sb.from('avaliacoes')
    .select('*, pacientes(*)').eq('id', avaliacaoId).single();
  if (!aval) throw new Error('Avaliação não encontrada');
  const { data: anam } = await sb.from('anamnese').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();

  const histResumo = anam ? [
    anam.historia_doenca_atual && `Hist. doença atual: ${anam.historia_doenca_atual}`,
    Object.entries(anam.historico_medico || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || null,
    anam.medicamentos && `Medicamentos: ${anam.medicamentos}`,
  ].filter(Boolean).join('; ') : '';

  const ctx: PacienteContexto = {
    nome: aval.pacientes.nome,
    sexo: aval.pacientes.sexo,
    idade: calcIdade(aval.pacientes.data_nascimento),
    objetivo: anam?.objetivos ?? undefined,
    historicoResumido: histResumo || undefined,
  };
  return { ctx, clinicaId: aval.clinica_id, avaliadorId: aval.avaliador_id, pacienteId: aval.paciente_id };
}

function calcIdade(iso: string): number {
  const d = new Date(iso); const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

async function registrarUso(clinicaId: string, avaliacaoId: string, tipo: string, r: any) {
  const sb = createAdminClient();
  await sb.from('ia_uso').insert({
    clinica_id: clinicaId, avaliacao_id: avaliacaoId, tipo,
    tokens_input: r.tokensIn, tokens_output: r.tokensOut,
    custo_usd: r.custoUsd, modelo: r.modelo,
  });
}

async function persistir(avaliacaoId: string, tipo: TipoAnalise, conteudo: any, modelo: string) {
  const sb = createAdminClient();
  const conteudoPaciente = conteudo?.versao_paciente
    ? { texto: conteudo.versao_paciente }
    : null;
  await sb.from('analises_ia').upsert({
    avaliacao_id: avaliacaoId, tipo, conteudo,
    ...(conteudoPaciente ? { conteudo_paciente: conteudoPaciente } : {}),
    gerado_em: new Date().toISOString(), gerado_por: 'ia', modelo_ia: modelo,
  }, { onConflict: 'avaliacao_id,tipo' });
}

const TABELA: Record<string, string> = {
  anamnese: 'anamnese', sinais_vitais: 'sinais_vitais',
  posturografia: 'posturografia', antropometria: 'antropometria',
  bioimpedancia: 'bioimpedancia',
  forca: 'forca', flexibilidade: 'flexibilidade',
  rml: 'rml',
  cardiorrespiratorio: 'cardiorrespiratorio',
  biomecanica_corrida: 'biomecanica_corrida',
};

export async function gerarAnaliseModulo(avaliacaoId: string, modulo: TipoAnalise) {
  const sb = createAdminClient();
  const { ctx, clinicaId } = await carregarContexto(avaliacaoId);

  const tabela = TABELA[modulo];
  if (!tabela) throw new Error(`Tipo inválido: ${modulo}`);

  const { data: dados } = await sb.from(tabela).select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
  if (!dados) throw new Error(`Sem dados em ${modulo} para gerar análise`);

  const builders: Record<string, (ctx: PacienteContexto, dados: any) => { system: string; user: string }> = {
    anamnese: P.promptAnamnese,
    sinais_vitais: P.promptSinaisVitais,
    posturografia: P.promptPosturografia,
    antropometria: P.promptAntropometria,
    bioimpedancia: P.promptBioimpedancia,
    forca: P.promptForca,
    flexibilidade: P.promptFlexibilidade,
    rml: P.promptRML,
    cardiorrespiratorio: P.promptCardio,
    biomecanica_corrida: P.promptBiomecanica,
  };
  const builder = builders[modulo];

  const { system, user } = builder(ctx, dados);
  const resp = await llmCall({ system, user, json: true, temperature: 0.4 });
  const conteudo = parseJSON(resp.text);
  await persistir(avaliacaoId, modulo, conteudo, resp.modelo);
  await registrarUso(clinicaId, avaliacaoId, modulo, resp);
  return conteudo;
}

export async function gerarConclusaoGlobal(avaliacaoId: string) {
  const sb = createAdminClient();
  const { ctx, clinicaId } = await carregarContexto(avaliacaoId);

  const [{ data: scores }, { data: analises }] = await Promise.all([
    sb.from('scores').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    sb.from('analises_ia').select('tipo, conteudo').eq('avaliacao_id', avaliacaoId),
  ]);

  const analisesMap: Record<string, any> = {};
  (analises ?? []).forEach((a: any) => { analisesMap[a.tipo] = a.conteudo; });

  const { system, user } = P.promptConclusao(ctx, { scores, analises: analisesMap });
  const resp = await llmCall({ system, user, json: true, temperature: 0.5, maxTokens: 1800 });
  const conteudo = parseJSON(resp.text);
  await persistir(avaliacaoId, 'conclusao_global', conteudo, resp.modelo);
  await registrarUso(clinicaId, avaliacaoId, 'conclusao_global', resp);
  return conteudo;
}

export async function gerarAnaliseEvolucao(avaliacaoAtualId: string) {
  const sb = createAdminClient();
  const { ctx, clinicaId, pacienteId } = await carregarContexto(avaliacaoAtualId);

  const { data: avals } = await sb
    .from('avaliacoes')
    .select(`id, data,
      scores(*),
      antropometria(peso, estatura, imc, percentual_gordura, massa_magra),
      forca(preensao_dir_kgf, preensao_esq_kgf, assimetria_percent),
      cardiorrespiratorio(vo2max, l2, vam, fc_repouso)
    `)
    .eq('paciente_id', pacienteId)
    .eq('status', 'finalizada')
    .order('data', { ascending: true });

  if (!avals || avals.length < 2) throw new Error('Mínimo 2 avaliações finalizadas');

  const historico = avals.map((a: any) => ({
    data: a.data,
    scores: Array.isArray(a.scores) ? a.scores[0] : a.scores,
    antropometria: Array.isArray(a.antropometria) ? a.antropometria[0] : a.antropometria,
    forca: Array.isArray(a.forca) ? a.forca[0] : a.forca,
    cardio: Array.isArray(a.cardiorrespiratorio) ? a.cardiorrespiratorio[0] : a.cardiorrespiratorio,
  }));

  const { system, user } = P.promptEvolucao(ctx, historico);
  const resp = await llmCall({ system, user, json: true, temperature: 0.4, maxTokens: 1500 });
  const conteudo = parseJSON(resp.text);
  await persistir(avaliacaoAtualId, 'evolucao', conteudo, resp.modelo);
  await registrarUso(clinicaId, avaliacaoAtualId, 'evolucao', resp);
  return conteudo;
}
