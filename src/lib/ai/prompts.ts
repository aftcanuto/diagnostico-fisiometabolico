/**
 * Prompts especializados por módulo. Retornam JSON estruturado.
 * Personalizado por sexo, idade e objetivo do paciente.
 */
import { referenciasModulo } from '@/lib/clinical/references';

export interface PacienteContexto {
  nome: string;
  sexo: 'M' | 'F';
  idade: number;
  objetivo?: string;
  historicoResumido?: string;
}

const SISTEMA_BASE = (ctx: PacienteContexto) => `Você é especialista em avaliação fisiometabólica, performance humana e medicina do exercício, com formação em fisioterapia, nutrição e treinamento esportivo. Redige laudos clínicos em português brasileiro com linguagem técnica precisa mas acessível.

Paciente:
- Nome: ${ctx.nome}
- Sexo: ${ctx.sexo === 'M' ? 'Masculino' : 'Feminino'}
- Idade: ${ctx.idade} anos
- Objetivo declarado: ${ctx.objetivo || 'não informado'}
- Contexto clínico: ${ctx.historicoResumido || 'sem comorbidades relatadas'}

Personalize as recomendações ao perfil acima. Considere diferenças fisiológicas por sexo e idade. Não invente números nem diagnósticos médicos. Não afirme doença, prognóstico médico ou tratamento fora do escopo profissional. Recomende avaliação médica, fisioterapêutica ou nutricional quando houver sinais de alerta, dor, sintomas, achados conflitantes ou necessidade de conduta privativa.

Retorne APENAS JSON válido com este schema:
{
  "achados": string[],
  "interpretacao": string,
  "riscos": string[],
  "beneficios": string[],
  "recomendacoes": string[],
  "alertas": string[]
}`;

export function promptAnamnese(ctx: PacienteContexto, dados: any) {
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: ANAMNESE\n\nReferências e limites obrigatórios:\n${referenciasModulo('anamnese')}\n\nDados:\n${JSON.stringify(dados, null, 2)}\n\nAnalise contexto clínico, hábitos de vida, histórico médico e objetivos. Identifique fatores de risco modificáveis, lacunas e aspectos comportamentais prioritários.`
  };
}

export function promptSinaisVitais(ctx: PacienteContexto, dados: any) {
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: SINAIS VITAIS\n\nReferências e limites obrigatórios:\n${referenciasModulo('sinais_vitais')}\n\nDados:\n${JSON.stringify(dados, null, 2)}\n\nInterprete PA, FC, SpO₂ e demais parâmetros considerando faixa etária, sexo e contexto. Aponte valores fora da normalidade e seu significado clínico.`
  };
}

export function promptPosturografia(ctx: PacienteContexto, dados: any) {
  const desvios = Object.entries(dados?.alinhamentos ?? {})
    .filter(([, v]) => v).map(([k]) => k.replace(/_/g, ' '));
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: POSTUROGRAFIA\n\nReferências e limites obrigatórios:\n${referenciasModulo('posturografia')}\n\nDesvios: ${desvios.length ? desvios.join(', ') : 'nenhum'}\nObservações: ${dados?.observacoes || '—'}\n\nInterprete o padrão postural. Explique cadeias musculares encurtadas/inibidas para cada desvio. Recomende exercícios corretivos específicos (alongamentos, fortalecimento, controle motor) e tempo de reavaliação.`
  };
}

export function promptAntropometria(ctx: PacienteContexto, dados: any) {
  const estM = dados?.estatura ? dados.estatura / 100 : 1.75;
  const ffmi = dados?.massa_magra ? +(dados.massa_magra / (estM * estM)).toFixed(1) : null;
  const limiteMax = ctx.sexo === 'M' ? (dados?.estatura ?? 175) - 100 : ((dados?.estatura ?? 165) - 100) * 0.85;
  const pctPotencial = dados?.massa_magra ? +((dados.massa_magra / limiteMax) * 100).toFixed(1) : null;
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: ANTROPOMETRIA (ISAK)\n\nReferências e limites obrigatórios:\n${referenciasModulo('antropometria')}\n\nDados:\n- Peso: ${dados?.peso} kg · Estatura: ${dados?.estatura} cm · IMC: ${dados?.imc}\n- % Gordura: ${dados?.percentual_gordura}% · Massa magra: ${dados?.massa_magra} kg · Massa óssea: ${dados?.massa_ossea} kg\n- Somatotipo: ${JSON.stringify(dados?.somatotipo)}\n- Circunferências: ${JSON.stringify(dados?.circunferencias)}\n- FFMI (Fat-Free Mass Index): ${ffmi}\n- Potencial genético atingido (Berkhan): ${pctPotencial}% (limite estimado: ${limiteMax.toFixed(1)} kg de massa magra)\n\nInterprete a composição corporal considerando sexo e idade. Avalie o FFMI e informe ao paciente quão próximo está do limite natural muscular. Comente sobre a massa óssea em relação ao esperado. Dê recomendações nutricionais gerais (macros, sem prescrever dieta) e de treinamento alinhadas ao objetivo.`
  };
}

export function promptForca(ctx: PacienteContexto, dados: any) {
  const dinam = dados?.dinamometria ?? [];
  const dinamTexto = dinam.length > 0
    ? `\nDinâmica isométrica:\n${dinam.map((d: any) => `- ${d.grupo_muscular}: ${d.valor_kgf} kgf${d.valor_nm ? ` / ${d.valor_nm} N·m` : ''}${d.observacao ? ` (${d.observacao})` : ''}`).join('\n')}`
    : '';
  const sptechTexto = (dados?.sptech_testes ?? []).length > 0
    ? `\nDinamometria Medeor/SPTech:\n${JSON.stringify(dados?.sptech_testes)}`
    : '';
  const tracaoTexto = (dados?.tracao_testes ?? []).length > 0
    ? `\nDinamometria por tração:\n${JSON.stringify(dados?.tracao_testes)}`
    : '';
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: FORÇA\n\nReferências e limites obrigatórios:\n${referenciasModulo('forca')}\n\nPreensão palmar:\n- Direita: ${dados?.preensao_dir_kgf} kgf · Esquerda: ${dados?.preensao_esq_kgf} kgf\n- Força relativa: D ${dados?.forca_relativa_dir} / E ${dados?.forca_relativa_esq} kgf/kg\n- Assimetria: ${dados?.assimetria_percent}%\n- Testes: ${JSON.stringify(dados?.testes ?? [])}\n- Pop. referência: ${dados?.populacao_ref}${dinamTexto}${sptechTexto}${tracaoTexto}\n\nInterprete considerando faixa etária e população. Discuta assimetria, RFD, 1RM estimado e impacto funcional. Se houver dados de dinamometria isométrica, analise cada grupo muscular, identifique desequilíbrios bilaterais e proponha intervenções específicas. Mencione que preensão é preditor de longevidade.`
  };
}

export function promptFlexibilidade(ctx: PacienteContexto, dados: any) {
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: FLEXIBILIDADE (Banco de Wells / Sit and Reach)\n\nReferências e limites obrigatórios:\n${referenciasModulo('flexibilidade')}\n\nDados:\n- Tentativa 1: ${dados?.tentativa_1} cm · Tentativa 2: ${dados?.tentativa_2} cm · Tentativa 3: ${dados?.tentativa_3} cm\n- Melhor resultado: ${dados?.melhor_resultado} cm\n- Classificação: ${dados?.classificacao}\n- Observações: ${dados?.observacoes || '—'}\n\nInterprete o nível de flexibilidade considerando sexo e idade (tabela ACSM). Explique as implicações da flexibilidade posterior para saúde lombar, performance esportiva e prevenção de lesões. Recomende exercícios de alongamento específicos (estático, dinâmico, PNF) com frequência, duração e progressão. Relacione com achados posturais se disponível.`
  };
}

export function promptCardio(ctx: PacienteContexto, dados: any) {
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: CARDIORRESPIRATÓRIO\n\nReferências e limites obrigatórios:\n${referenciasModulo('cardiorrespiratorio')}\n\nDados:\n- VO₂máx: ${dados?.vo2max} ml/kg/min\n- L2: ${dados?.l2} km/h · VAM: ${dados?.vam} km/h\n- FCmáx: ${dados?.fc_max} bpm · FC repouso: ${dados?.fc_repouso} bpm\n- Zonas: ${JSON.stringify(dados?.zonas)}\n\nInterprete a capacidade CR considerando sexo/idade. Classifique o VO₂máx. Dê uma semana típica de treino com distribuição Z1-Z5 alinhada ao objetivo.`
  };
}

export function promptConclusao(ctx: PacienteContexto, modulos: {
  scores?: any; analises?: Record<string, any>;
}) {
  return {
    system: `Você sintetiza diagnósticos fisiometabólicos em uma conclusão executiva. Linguagem técnica clara, tom profissional e motivador.

Paciente: ${ctx.nome}, ${ctx.sexo === 'M' ? 'masculino' : 'feminino'}, ${ctx.idade} anos.
Objetivo: ${ctx.objetivo || 'não informado'}.

Retorne APENAS JSON:
{
  "resumo_executivo": string,
  "pontos_fortes": string[],
  "pontos_criticos": string[],
  "prioridades": [{ "titulo": string, "acao": string, "prazo": string }],
  "mensagem_paciente": string
}`,
    user: `Referências e limites obrigatórios:\n${referenciasModulo('geral')}\n\nScores:\n${JSON.stringify(modulos.scores, null, 2)}\n\nAnálises:\n${JSON.stringify(modulos.analises, null, 2)}\n\nSintetize o quadro global, aponte pontos fortes/críticos e indique 3 prioridades com prazo realista.`
  };
}

export function promptBioimpedancia(ctx: PacienteContexto, dados: any) {
  const sm = dados?.segmentar_magra ?? {};
  const sg = dados?.segmentar_gordura ?? {};
  const segs = ['braco_dir','braco_esq','tronco','perna_dir','perna_esq'];
  const lb: Record<string,string> = {braco_dir:'Braço D',braco_esq:'Braço E',tronco:'Tronco',perna_dir:'Perna D',perna_esq:'Perna E'};
  const segTexto = segs.some(k => sm[k] || sg[k])
    ? '\nAnálise segmentar:\n' + segs.map(k =>
        `- ${lb[k]}: Massa magra ${sm[k]?.kg ?? '—'} kg (${sm[k]?.pct ?? '—'}%) · Gordura ${sg[k]?.kg ?? '—'} kg (${sg[k]?.pct ?? '—'}%)`
      ).join('\n')
    : '';
  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: BIOIMPEDÂNCIA — ${dados?.aparelho ?? 'Avabio 380'}

Referências e limites obrigatórios:
${referenciasModulo('bioimpedancia')}

Análise global:
- Peso: ${dados?.peso_kg} kg · % Gordura: ${dados?.percentual_gordura}% · Massa de Gordura: ${dados?.massa_gordura_kg} kg
- Massa Livre de Gordura (MLG): ${dados?.massa_livre_gordura_kg} kg · Água Corporal: ${dados?.agua_corporal_kg} kg · IMC: ${dados?.imc}

Dados adicionais:
- TMB: ${dados?.taxa_metabolica_basal_kcal} kcal · Índice Apendicular: ${dados?.indice_apendicular} · Idade Metabólica: ${dados?.idade_metabolica} anos
- Gordura Visceral (nível): ${dados?.gordura_visceral_nivel}
${segTexto}

Analise criticamente a composição corporal considerando sexo e idade. Interprete o índice apendicular (ASMI — massa muscular apendicular/estatura²) como marcador de sarcopenia. Avalie gordura visceral e riscos metabólicos. Analise assimetrias D/E e desequilíbrio tronco/membros na distribuição segmentar. Dê recomendações de treinamento e nutrição baseadas nos dados.`
  };
}


export function promptRML(ctx: PacienteContexto, dados: any) {
  const cat = dados?.categoria === 'idoso' ? 'Idoso (≥60 anos) — protocolo Rikli & Jones' : 'Jovem/Ativo';
  
  const testes = [
    dados?.mmss_reps      != null && `Flexão de braço (${dados.mmss_modalidade ?? 'tradicional'}): ${dados.mmss_reps} rep → ${dados.mmss_classificacao ?? '—'}`,
    dados?.abd_1min_reps  != null && `Abdominal 1 min: ${dados.abd_1min_reps} rep → ${dados.abd_1min_classificacao ?? '—'}`,
    dados?.abd_prancha_seg != null && `Prancha ventral: ${dados.abd_prancha_seg} s → ${dados.abd_prancha_classificacao ?? '—'}`,
    dados?.mmii_agach_reps != null && `Agachamento 1 min: ${dados.mmii_agach_reps} rep → ${dados.mmii_agach_classificacao ?? '—'}`,
    dados?.mmii_wallsit_seg != null && `Wall Sit: ${dados.mmii_wallsit_seg} s → ${dados.mmii_wallsit_classificacao ?? '—'}`,
    dados?.idoso_sl_reps  != null && `Sentar e Levantar 30s: ${dados.idoso_sl_reps} rep → ${dados.idoso_sl_classificacao ?? '—'}`,
    dados?.idoso_armcurl_reps != null && `Arm Curl 30s: ${dados.idoso_armcurl_reps} rep → ${dados.idoso_armcurl_classificacao ?? '—'}`,
  ].filter(Boolean).join('\n');

  return {
    system: SISTEMA_BASE(ctx),
    user: `Módulo: RESISTÊNCIA MUSCULAR LOCALIZADA (RML)\n\nReferências e limites obrigatórios:\n${referenciasModulo('rml')}\n\nCategoria: ${cat}\nScore RML: ${dados?.score ?? '—'}/100\n\nTestes realizados:\n${testes || 'Nenhum teste registrado'}\n\nObservações: ${dados?.observacoes || '—'}\n\nAnalise a resistência muscular localizada por grupamento (MMSS, core, MMII). Identifique desequilíbrios entre grupamentos. Correlacione com o objetivo declarado e histórico. Proponha protocolo de treino específico para cada grupamento deficiente (séries, repetições, frequência, progressão). Mencione implicações funcionais e para qualidade de vida.`
  };
}

export function promptEvolucao(ctx: PacienteContexto, historico: any[]) {
  return {
    system: `Você analisa EVOLUÇÃO LONGITUDINAL. Identifica tendências, progressos, regressões e emite alertas.

Paciente: ${ctx.nome}, ${ctx.sexo === 'M' ? 'masculino' : 'feminino'}, ${ctx.idade} anos.

Referências e limites obrigatórios:
${referenciasModulo('evolucao')}

Retorne APENAS JSON:
{
  "tendencias": string[],
  "progressos": string[],
  "regressoes": string[],
  "alertas": string[],
  "interpretacao": string,
  "proximos_passos": string[]
}`,
    user: `Histórico (ordem cronológica antigo→recente):\n${JSON.stringify(historico, null, 2)}\n\nAnalise a evolução.`
  };
}

export function promptBiomecanica(ctx: PacienteContexto, dados: any) {
  const ang = dados.angulos ?? {};
  const met = dados.metricas ?? {};
  const achados = dados.achados ?? {};

  const REFERENCIAS: Record<string, {min:number;max:number;nome:string}> = {
    cabeca:           { min:-13, max:-3,  nome:'Alinhamento da cabeça' },
    tronco:           { min:8,   max:14,  nome:'Posicionamento do tronco' },
    cotovelo:         { min:77,  max:87,  nome:'Cotovelo (MMSS)' },
    joelho_posterior: { min:0,   max:97,  nome:'Joelho posterior' },
    joelho_impacto:   { min:155, max:175, nome:'Joelho no impacto' },
    overstride:       { min:0,   max:10,  nome:'Overstride' },
  };

  const angulosTexto = Object.entries(ang).map(([k, v]: any) => {
    const ref = REFERENCIAS[k];
    return `${ref?.nome ?? k}: ${v.valor}° (ideal: ${v.ideal_min}° a ${v.ideal_max}°) — ${v.classificacao}`;
  }).join('\n');

  return {
    system: `Você é um especialista em biomecânica da corrida. Analise os dados cinemáticos e emita uma interpretação clínica detalhada em PORTUGUÊS.

Paciente: ${ctx.nome}, ${ctx.sexo === 'M' ? 'masculino' : 'feminino'}, ${ctx.idade} anos.
Velocidade de corrida: ${dados.velocidade_kmh ?? '—'} km/h.

Retorne APENAS JSON válido:
{
  "achados": string[],
  "interpretacao": string,
  "riscos": string[],
  "beneficios": string[],
  "recomendacoes": string[],
  "alertas": string[]
}`,
    user: `Referências e limites obrigatórios:
${referenciasModulo('biomecanica_corrida')}

ÂNGULOS CINEMÁTICOS:\n${angulosTexto}

MÉTRICAS DA PASSADA:
- Frequência de passos: ${met.frequencia_passos_ppm ?? '—'} ppm
- Comprimento da passada: ${met.comprimento_passada_m ?? '—'} m
- Contato solo: ${met.tempo_contato_solo_s ?? '—'} s
- Fator de esforço: ${met.fator_esforco_pct ?? '—'}% (${met.fator_esforco_tipo ?? '—'})

ACHADOS CLÍNICOS:
${achados.mecanica_frenagem ? '⚠️ Mecânica de frenagem (overstride)' : ''}
${achados.sobrecarga_articular ? '⚠️ Sobrecarga articular e muscular' : ''}
${achados.deslocamento_cg ? '⚠️ Deslocamento do centro de gravidade' : ''}
${achados.ineficiencia_propulsiva ? '⚠️ Ineficiência propulsiva' : ''}
${achados.observacoes ? 'Observações: ' + achados.observacoes : ''}

Emita análise clínica detalhada.`
  };
}
