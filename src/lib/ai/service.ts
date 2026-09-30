/**
 * Orquestração de análises de IA. Persiste em analises_ia e registra uso.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { modulosDaAvaliacao } from '@/lib/clinical/references';
import { llmCall, parseJSON } from './client';
import * as P from './prompts';
import type { PacienteContexto } from './prompts';
import { jumpSchema, jumpSummary, jumpComparable, jumpIsSimulated, jumpClinicalContext } from '@/lib/jump-test';
import { anthropometryAIData, isAnthropometryV2 } from '@/lib/anthropometry-record';

async function stampAnthropometry(sb: any, avaliacaoId: string, row: any, content: any) {
  if (!isAnthropometryV2(row)) return;
  const { data, error } = await sb.from('antropometria').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
  if (error || data?.revision_v2 !== row.revision_v2) throw new Error('Antropometria alterada durante a geracao. Gere novamente.');
  content._anthropometry_revision = row.revision_v2;
}

export type TipoAnalise =
  | 'anamnese' | 'sinais_vitais' | 'posturografia' | 'termografia' | 'jump_test'
  | 'antropometria' | 'bioimpedancia' | 'forca' | 'flexibilidade'
  | 'rml' | 'cardiorrespiratorio' | 'biomecanica_corrida'
  | 'conclusao_global' | 'evolucao';

async function carregarAnamnese(sb: any, avaliacaoId: string) {
  const { data, error } = await sb
    .from('anamnese')
    .select('*')
    .eq('avaliacao_id', avaliacaoId)
    .maybeSingle();
  if (error) throw new Error(`Falha ao carregar anamnese (${error.code})`);
  if (!data?.template_id) return data;

  const { data: template, error: templateError } = await sb
    .from('anamnese_templates')
    .select('campos')
    .eq('id', data.template_id)
    .maybeSingle();
  if (templateError) throw new Error(`Falha ao carregar rótulos da anamnese (${templateError.code})`);

  if (!template) throw new Error('Template da anamnese não encontrado para rotular as respostas');
  return { ...data, anamnese_templates: template };
}

async function carregarContexto(avaliacaoId: string) {
  const sb = createAdminClient();
  const { data: aval } = await sb.from('avaliacoes')
    .select('*, pacientes(*)').eq('id', avaliacaoId).single();
  if (!aval) throw new Error('Avaliação não encontrada');
  const anam = await carregarAnamnese(sb, avaliacaoId);
  const contextoAnamnese = anam
    ? P.contextoAnamneseParaIA(anam)
    : { objetivo: undefined, historicoResumido: undefined };

  const ctx: PacienteContexto = {
    nome: aval.pacientes.nome,
    sexo: aval.pacientes.sexo,
    idade: calcIdade(aval.pacientes.data_nascimento, aval.data),
    objetivo: contextoAnamnese.objetivo ?? undefined,
    historicoResumido: contextoAnamnese.historicoResumido ?? undefined,
  };
  return { ctx, clinicaId: aval.clinica_id, avaliadorId: aval.avaliador_id, pacienteId: aval.paciente_id };
}

function calcIdade(iso: string, dataAvaliacao?: string): number {
  const d = new Date(iso); const now = dataAvaliacao ? new Date(dataAvaliacao) : new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

async function registrarUso(clinicaId: string, avaliacaoId: string, tipo: string, r: any) {
  const sb = createAdminClient();
  const { error } = await sb.from('ia_uso').insert({
    clinica_id: clinicaId, avaliacao_id: avaliacaoId, tipo,
    tokens_input: r.tokensIn, tokens_output: r.tokensOut,
    custo_usd: r.custoUsd, modelo: r.modelo,
  });
  if (error) console.error('[IA] Falha ao registrar uso', error);
}

async function persistir(avaliacaoId: string, tipo: TipoAnalise, conteudo: any, modelo: string) {
  const sb = createAdminClient();
  const conteudoPaciente = conteudo?.versao_paciente
    ? { texto: conteudo.versao_paciente }
    : null;
  const { error } = await sb.from('analises_ia').upsert({
    avaliacao_id: avaliacaoId, tipo, conteudo,
    ...(conteudoPaciente ? { conteudo_paciente: conteudoPaciente } : {}),
    ...(['jump_test', 'antropometria', 'conclusao_global', 'evolucao'].includes(tipo) ? { texto_editado: null, texto_paciente_editado: null } : {}),
    gerado_em: new Date().toISOString(), gerado_por: 'ia', modelo_ia: modelo,
  }, { onConflict: 'avaliacao_id,tipo' });
  if (error) {
    console.error('[IA] Falha ao salvar análise', error);
    throw new Error(`Falha ao salvar análise de IA (${error.code})`);
  }
}

async function carregarModelosInterpretacao(clinicaId: string, modulo: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from('modelos_interpretacao_modulos')
    .select('titulo, condicao_uso, interpretacao, riscos, recomendacoes')
    .eq('clinica_id', clinicaId)
    .eq('modulo', modulo)
    .eq('ativo', true)
    .order('ordem')
    .order('titulo');

  return data ?? [];
}

function blocoModelosInterpretacao(modelos: any[]) {
  if (!modelos.length) return '';
  return [
    'Modelos de interpretação cadastrados pela clínica:',
    ...modelos.map((modelo, index) => {
      const partes = [
        `${index + 1}. ${modelo.titulo}`,
        modelo.condicao_uso ? `Quando usar: ${modelo.condicao_uso}` : '',
        modelo.interpretacao ? `Interpretação padrão: ${modelo.interpretacao}` : '',
        modelo.riscos ? `Riscos/pontos de atenção: ${modelo.riscos}` : '',
        modelo.recomendacoes ? `Recomendações padrão: ${modelo.recomendacoes}` : '',
      ].filter(Boolean);
      return partes.join('\n');
    }),
    'Use estes modelos como guia de estilo e raciocínio clínico quando forem compatíveis com os dados. Não copie mecanicamente se os achados não sustentarem o texto.',
  ].join('\n\n');
}

const TABELA: Record<string, string> = {
  anamnese: 'anamnese', sinais_vitais: 'sinais_vitais',
  posturografia: 'posturografia', antropometria: 'antropometria',
  termografia: 'termografia',
  jump_test: 'jump_test',
  bioimpedancia: 'bioimpedancia',
  forca: 'forca', flexibilidade: 'flexibilidade',
  rml: 'rml',
  cardiorrespiratorio: 'cardiorrespiratorio',
  biomecanica_corrida: 'biomecanica_corrida',
};

async function carregarContextoJump(sb: any, avaliacaoId: string, jump: ReturnType<typeof jumpSchema.parse>) {
  const { data: atual, error } = await sb.from('avaliacoes').select('id,paciente_id,clinica_id,data,modulos_selecionados').eq('id', avaliacaoId).single();
  if (error || !atual) throw new Error('Falha ao carregar contexto do Jump Test');
  const tabelas = ['antropometria', 'bioimpedancia', 'forca', 'flexibilidade', 'biomecanica_corrida', 'termografia', 'cardiorrespiratorio', 'sinais_vitais'];
  const atuais: Record<string, unknown> = {};
  for (const tabela of tabelas) {
    if (!atual.modulos_selecionados?.[tabela]) continue;
    const result = await sb.from(tabela).select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
    if (result.error) throw new Error(`Falha ao carregar contexto ${tabela}`);
    // Images and document links are not necessary for this text-only interpretation.
    if (result.data) atuais[tabela] = JSON.parse(JSON.stringify(result.data, (key, value) => /foto|imagem|url|path|base64/i.test(key) ? undefined : value));
  }
  let query = sb.from('avaliacoes').select('id,data,jump_test(*)').eq('paciente_id', atual.paciente_id)
    .eq('status', 'finalizada').neq('id', avaliacaoId).lt('data', atual.data).order('data', { ascending: false }).limit(10);
  query = atual.clinica_id ? query.eq('clinica_id', atual.clinica_id) : query.is('clinica_id', null);
  const history = await query;
  if (history.error) throw new Error('Falha ao carregar historico Jump Test. Confira a migration.');
  const historico = (history.data ?? []).flatMap((a: any) => {
    const parsed = jumpSchema.safeParse(Array.isArray(a.jump_test) ? a.jump_test[0] : a.jump_test);
    if (!parsed.success) return [];
    if (jumpIsSimulated(parsed.data)) return [{ data: a.data, ...jumpClinicalContext(parsed.data), protocolos_comparaveis: [] }];
    const s = jumpSummary(parsed.data);
    return [{ data: a.data, resultados: s.pronto ? s : null, pendencias: s.pendencias,
      protocolos_comparaveis: s.pronto ? jump.protocolos.filter(p => jumpComparable(jump, parsed.data, p)) : [],
      massa_kg: parsed.data.peso_kg, metodo_potencia: parsed.data.metodo_potencia }];
  });
  return { data_atual: atual.data, outros_modulos_atuais: atuais, historico, limite_historico: 'Ate 10 avaliacoes finalizadas anteriores da mesma clinica; ausencia nao significa ausencia de historico clinico.' };
}

export async function gerarAnaliseModulo(avaliacaoId: string, modulo: TipoAnalise) {
  const sb = createAdminClient();
  const { ctx, clinicaId } = await carregarContexto(avaliacaoId);

  const tabela = TABELA[modulo];
  if (!tabela) throw new Error(`Tipo inválido: ${modulo}`);

  let dados: any = null;
  if (modulo === 'anamnese') {
    dados = await carregarAnamnese(sb, avaliacaoId);
  } else {
    const resultado = await sb.from(tabela).select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
    if (resultado.error) throw new Error(`Falha ao carregar ${modulo} (${resultado.error.code})`);
    dados = resultado.data;
  }
  if (!dados) throw new Error(`Sem dados em ${modulo} para gerar análise`);
  const jumpUpdatedAt = dados.updated_at;
  if (modulo === 'jump_test') {
    const jump = jumpSchema.parse(dados), summary = jumpSummary(jump);
    if (!summary.pronto) throw new Error(`Revise o Jump Test antes da analise: ${summary.pendencias.join(' ')}`);
    dados = { ...jump, contexto_integrado: await carregarContextoJump(sb, avaliacaoId, jump) };
  }

  const builders: Record<string, (ctx: PacienteContexto, dados: any) => { system: string; user: string }> = {
    anamnese: P.promptAnamnese,
    sinais_vitais: P.promptSinaisVitais,
    posturografia: P.promptPosturografia,
    termografia: P.promptTermografia,
    jump_test: P.promptJumpTest,
    antropometria: P.promptAntropometria,
    bioimpedancia: P.promptBioimpedancia,
    forca: P.promptForca,
    flexibilidade: P.promptFlexibilidade,
    rml: P.promptRML,
    cardiorrespiratorio: P.promptCardio,
    biomecanica_corrida: P.promptBiomecanica,
  };
  const builder = builders[modulo];

  const modelos = await carregarModelosInterpretacao(clinicaId, modulo);
  const modelosTexto = blocoModelosInterpretacao(modelos);
  const { system, user } = builder(ctx, dados);
  const promptUser = modelosTexto ? `${user}\n\n${modelosTexto}` : user;
  const resp = await llmCall({ system, user: promptUser, json: true, temperature: 0.4 });
  const conteudo = parseJSON(resp.text);
  if (modulo === 'antropometria') await stampAnthropometry(sb, avaliacaoId, dados, conteudo);
  if (modulo === 'jump_test') {
    const { data: current } = await sb.from('jump_test').select('updated_at').eq('avaliacao_id', avaliacaoId).single();
    if (current?.updated_at !== jumpUpdatedAt) throw new Error('Jump Test alterado durante a geracao. Gere novamente.');
    conteudo._jump_updated_at = jumpUpdatedAt;
  }
  await persistir(avaliacaoId, modulo, conteudo, resp.modelo);
  await registrarUso(clinicaId, avaliacaoId, modulo, resp);
  return conteudo;
}

export async function gerarConclusaoGlobal(avaliacaoId: string) {
  const sb = createAdminClient();
  const { ctx, clinicaId } = await carregarContexto(avaliacaoId);

  const [{ data: scores }, { data: analises }, { data: avaliacao, error: erroAvaliacao }] = await Promise.all([
    sb.from('scores').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle(),
    sb.from('analises_ia').select('tipo, conteudo').eq('avaliacao_id', avaliacaoId),
    sb.from('avaliacoes').select('modulos_selecionados').eq('id', avaliacaoId).single(),
  ]);
  if (erroAvaliacao || !avaliacao) throw new Error('Falha ao carregar modulos da avaliacao');
  const selecionados = modulosDaAvaliacao({ ...Object.fromEntries((analises ?? []).map((a: any) => [a.tipo, a.conteudo])), ...avaliacao });

  const analisesMap: Record<string, any> = {};
  (analises ?? []).forEach((a: any) => {
    if (!['conclusao_global', 'evolucao', 'jump_test'].includes(a.tipo) && (selecionados[a.tipo] === true || (a.tipo === 'anamnese' && avaliacao.modulos_selecionados?.anamnese !== false))) analisesMap[a.tipo] = a.conteudo;
  });

  const { data: jumpRow } = await sb.from('jump_test').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
  const jump = jumpSchema.safeParse(jumpRow);
  if (jump.success && selecionados.jump_test === true) {
    analisesMap.jump_test = jumpClinicalContext(jump.data);
    if (!jumpIsSimulated(jump.data)) analisesMap.jump_test.contexto_integrado = await carregarContextoJump(sb, avaliacaoId, jump.data);
  }
  const { data: anthropometry, error: anthropometryError } = await sb.from('antropometria').select('*').eq('avaliacao_id', avaliacaoId).maybeSingle();
  if (anthropometryError) throw new Error('Falha ao carregar antropometria para conclusao.');
  if (selecionados.antropometria && isAnthropometryV2(anthropometry)) analisesMap.antropometria = anthropometryAIData(anthropometry);
  const prompt = P.promptConclusao(ctx, { scores, analises: analisesMap, selecionados, anthropometry });
  const system = `${prompt.system}\n${P.JUMP_AI_RULES}\n${P.ANTHROPOMETRY_AI_RULES}`, user = prompt.user;
  const resp = await llmCall({ system, user, json: true, temperature: 0.5, maxTokens: 1800 });
  const conteudo = parseJSON(resp.text);
  await stampAnthropometry(sb, avaliacaoId, anthropometry, conteudo);
  await persistir(avaliacaoId, 'conclusao_global', conteudo, resp.modelo);
  await registrarUso(clinicaId, avaliacaoId, 'conclusao_global', resp);
  return conteudo;
}

export async function gerarAnaliseEvolucao(avaliacaoAtualId: string) {
  const sb = createAdminClient();
  const { ctx, clinicaId, pacienteId } = await carregarContexto(avaliacaoAtualId);

  const { data: avals } = await sb
    .from('avaliacoes')
    .select(`id, data, modulos_selecionados,
      scores(*),
      antropometria(*),
      termografia(temperatura_ambiente, umidade_relativa, tempo_aclimatacao_min, rois, conclusao_funcional),
      jump_test(*),
      forca(preensao_dir_kgf, preensao_esq_kgf, assimetria_percent),
      cardiorrespiratorio(vo2max, l2, vam, fc_repouso)
    `)
    .eq('paciente_id', pacienteId)
    .eq('status', 'finalizada')
    .order('data', { ascending: true });

  if (!avals || avals.length < 2) throw new Error('Mínimo 2 avaliações finalizadas');

  const historico = avals.map((a: any) => ({
    data: a.data,
    modulos_selecionados: a.modulos_selecionados,
    scores: Array.isArray(a.scores) ? a.scores[0] : a.scores,
    antropometria: anthropometryAIData(Array.isArray(a.antropometria) ? a.antropometria[0] : a.antropometria),
    termografia: Array.isArray(a.termografia) ? a.termografia[0] : a.termografia,
    jump_test: (() => {
      const row = jumpSchema.safeParse(Array.isArray(a.jump_test) ? a.jump_test[0] : a.jump_test);
      if (!row.success) return null;
      if (jumpIsSimulated(row.data)) return jumpClinicalContext(row.data);
      const result = jumpSummary(row.data);
      return result.pronto ? { resultados: result, observacoes: row.data.observacoes, conclusao_profissional: row.data.conclusao, protocolo: { altura_queda_cm: row.data.altura_queda_cm, duracao_s: row.data.duracao_s, equipamento: row.data.equipamento, software: row.data.software, bracos: row.data.bracos, descanso_s: row.data.descanso_s, metodo_potencia: row.data.metodo_potencia } } : { pendencias: result.pendencias };
    })(),
    forca: Array.isArray(a.forca) ? a.forca[0] : a.forca,
    cardio: Array.isArray(a.cardiorrespiratorio) ? a.cardiorrespiratorio[0] : a.cardiorrespiratorio,
  }));

  const prompt = P.promptEvolucao(ctx, historico, avals.map((a: any) => Array.isArray(a.antropometria) ? a.antropometria[0] : a.antropometria));
  const system = `${prompt.system}\n${P.JUMP_AI_RULES}\n${P.ANTHROPOMETRY_AI_RULES}`, user = prompt.user;
  const resp = await llmCall({ system, user, json: true, temperature: 0.4, maxTokens: 1500 });
  const conteudo = parseJSON(resp.text);
  const current = avals.find((a: any) => a.id === avaliacaoAtualId)?.antropometria;
  await stampAnthropometry(sb, avaliacaoAtualId, Array.isArray(current) ? current[0] : current, conteudo);
  await persistir(avaliacaoAtualId, 'evolucao', conteudo, resp.modelo);
  await registrarUso(clinicaId, avaliacaoAtualId, 'evolucao', resp);
  return conteudo;
}
