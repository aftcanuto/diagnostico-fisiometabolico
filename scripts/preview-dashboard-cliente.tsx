import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortalPaciente } from '../src/components/PortalPaciente';

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const grafico = (cor: string, cor2: string) => svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="544" height="443"><rect width="100%" height="100%" fill="#050505"/><line x1="58" y1="390" x2="520" y2="390" stroke="#4b5563"/><line x1="58" y1="16" x2="58" y2="390" stroke="#4b5563"/><text x="25" y="377" fill="#7c8794" font-size="14">0°</text><text x="22" y="291" fill="#7c8794" font-size="14">30°</text><text x="22" y="204" fill="#7c8794" font-size="14">60°</text><text x="22" y="121" fill="#7c8794" font-size="14">90°</text><text x="16" y="38" fill="#7c8794" font-size="14">120°</text><text x="70" y="408" fill="#7c8794" font-size="14">0%</text><text x="168" y="408" fill="#7c8794" font-size="14">25%</text><text x="278" y="408" fill="#7c8794" font-size="14">50%</text><text x="389" y="408" fill="#7c8794" font-size="14">75%</text><text x="492" y="408" fill="#7c8794" font-size="14">100%</text><text x="245" y="428" fill="#7c8794" font-size="14">Ciclo de corrida (%)</text><text x="16" y="238" fill="#7c8794" font-size="14" transform="rotate(-90 16 238)">Ângulo (°)</text><polyline points="70,242 92,205 122,185 153,190 184,226 220,283 254,286 289,244 324,197 360,146 389,84 421,61 453,90 484,179 510,252" fill="none" stroke="${cor}" stroke-width="3"/><polyline points="70,273 98,238 132,204 162,216 196,260 227,287 260,282 296,234 331,185 370,137 402,70 432,71 466,132 494,249 520,291" fill="none" stroke="${cor2}" stroke-width="2"/></svg>`);

const fotoPostural = (titulo: string, cor = '#059669') => svgDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080"><rect width="720" height="1080" fill="#f8fafc"/><rect x="64" y="72" width="592" height="936" rx="28" fill="#fff" stroke="#cbd5e1" stroke-width="4"/><line x1="360" y1="130" x2="360" y2="930" stroke="${cor}" stroke-width="5" stroke-dasharray="18 16" opacity=".6"/><circle cx="360" cy="245" r="58" fill="${cor}" opacity=".85"/><path d="M315 326 C300 430 292 562 305 710 C312 790 322 880 337 948" fill="none" stroke="${cor}" stroke-width="44" stroke-linecap="round"/><path d="M405 326 C420 430 428 562 415 710 C408 790 398 880 383 948" fill="none" stroke="${cor}" stroke-width="44" stroke-linecap="round"/><path d="M280 410 C210 520 208 650 246 760" fill="none" stroke="${cor}" stroke-width="34" stroke-linecap="round" opacity=".85"/><path d="M440 410 C510 520 512 650 474 760" fill="none" stroke="${cor}" stroke-width="34" stroke-linecap="round" opacity=".85"/><text x="360" y="1038" text-anchor="middle" font-family="Inter,Arial" font-size="34" font-weight="800" fill="#334155">${titulo}</text></svg>`);

const spLado = (kgf: number, torque: number) => ({ kgf, torque_nm: torque, rm1_kg: +(kgf * 0.78).toFixed(1), cargas: { forca_min: +(kgf * 0.72).toFixed(1), forca_max: +(kgf * 0.86).toFixed(1) } });
const spTeste = (articulacao: string, movimento: string, d: number, e: number) => {
  const assim = +((Math.abs(d - e) / Math.max(d, e)) * 100).toFixed(1);
  return { articulacao, movimento, lado_d: spLado(d, +(d * 2.68).toFixed(1)), lado_e: spLado(e, +(e * 2.68).toFixed(1)), assimetria_pct: assim, classificacao_assimetria: assim < 10 ? 'Leve' : assim < 15 ? 'Moderada' : 'Alta' };
};
const tracaoTeste = (teste: string, musculo: string, exercicio_ref: string, fator: number, d: number, e: number, td = 380, te = 410) => {
  const assim = +((Math.abs(d - e) / Math.max(d, e)) * 100).toFixed(1);
  return {
    teste, musculo, exercicio_ref, fator: String(fator),
    lado_d: { fim_kgf: String(d), tempo_ms: String(td), rm1_kg: (d * fator).toFixed(1), rfd_kgf_s: (d / (td / 1000)).toFixed(1) },
    lado_e: { fim_kgf: String(e), tempo_ms: String(te), rm1_kg: (e * fator).toFixed(1), rfd_kgf_s: (e / (te / 1000)).toFixed(1) },
    assimetria_pct: String(assim), classificacao_assimetria: assim < 10 ? 'Leve' : assim < 15 ? 'Moderada' : 'Alta',
    observacoes: `Teste simulado completo para ${musculo}.`,
  };
};

export const avaliacaoAtual: any = {
  id: 'aval-2026-04',
  data: '2026-04-27',
  tipo: 'Diagnóstico completo',
  status: 'finalizada',
  scores: {
    global: 78,
    postura: 67,
    composicao_corporal: 74,
    forca: 82,
    flexibilidade: 80,
    rml: 76,
    cardiorrespiratorio: 84,
  },
  anamnese: {
    objetivo: 'Melhora de composição corporal e corrida recreativa',
    queixa_principal: 'Desconforto anterior no joelho direito após treinos longos',
    pratica_atividade: true,
    sono_horas: 7,
    nivel_estresse: 4,
    historico_lesoes: 'Entorse leve de tornozelo há 2 anos',
  },
  antropometria: {
    peso: 68.4,
    estatura: 166,
    percentual_gordura: 26.9,
    massa_magra: 50,
    massa_ossea: 2.7,
    imc: 24.8,
    rcq: 0.78,
    ffmi: 18.1,
    somatotipo: { endomorfia: 4.1, mesomorfia: 3.8, ectomorfia: 2.2 },
    dobras: {
      tricipital: 18,
      subescapular: 16,
      peitoral: 10,
      axilar_media: 14,
      suprailiaca: 20,
      abdominal: 24,
      coxa: 26,
    },
    diametros_osseos: {
      biacromial: 36.8,
      torax_transverso: 27.4,
      torax_anteroposterior: 18.6,
      biiliocristal: 28.9,
      umero_biepicondiliano: 6.2,
      femur_biepicondiliano: 8.9,
      punho: 5.4,
      tornozelo: 6.8,
    },
    circunferencias: {
      pescoco: 34,
      ombro: 102,
      torax: 88,
      braco_relaxado: 28.8,
      braco_dir_relaxado: 29,
      braco_esq_relaxado: 28.5,
      braco_dir_contraido: 31,
      braco_esq_contraido: 30.5,
      antebraco_dir: 24,
      antebraco_esq: 23.7,
      cintura: 72,
      abdome: 84,
      quadril: 92,
      coxa_dir_medial: 54,
      coxa_esq_medial: 53.5,
      panturrilha_dir: 36,
      panturrilha_esq: 35.6,
    },
  },
  bioimpedancia: {
    aparelho: 'InBody 370S',
    peso_kg: 68.4,
    altura_cm: 166,
    percentual_gordura: 26.9,
    massa_livre_gordura_kg: 50,
    massa_muscular_kg: 27.4,
    agua_corporal_kg: 35.4,
    agua_corporal_pct: 51.8,
    gordura_visceral: 7,
    gordura_visceral_nivel: 7,
    indice_apendicular: 7.1,
    idade_metabolica: 32,
    taxa_metabolica_basal_kcal: 1420,
    segmentar_magra: {
      braco_dir: { kg: 2.4, pct: 98 },
      braco_esq: { kg: 2.3, pct: 96 },
      tronco: { kg: 22.1, pct: 102 },
      perna_dir: { kg: 7.1, pct: 99 },
      perna_esq: { kg: 7.0, pct: 98 },
    },
    segmentar_gordura: {
      braco_dir: { kg: 1.8, pct: 112 },
      braco_esq: { kg: 1.9, pct: 115 },
      tronco: { kg: 8.4, pct: 126 },
      perna_dir: { kg: 3.2, pct: 108 },
      perna_esq: { kg: 3.1, pct: 106 },
    },
  },
  sinais_vitais: {
    pa_sistolica: 118,
    pa_diastolica: 76,
    fc_repouso: 64,
    spo2: 98,
  },
  cardiorrespiratorio: {
    vo2max: 42.5,
    classificacao_vo2: 'Bom',
    fc_limiar: 156,
    fc_max: 184,
    protocolo: 'Esteira incremental',
    zonas: [
      { nome: 'Z1', min: 92, max: 110 },
      { nome: 'Z2', min: 111, max: 129 },
      { nome: 'Z3', min: 130, max: 147 },
      { nome: 'Z4', min: 148, max: 166 },
      { nome: 'Z5', min: 167, max: 184 },
    ],
    rec_fc: {
      fc_1min: 152,
      fc_2min: 136,
      queda_1min: 32,
      queda_2min: 48,
    },
    zonas_limiar: [
      { nome: 'Z1 Recuperativo', min: 92, max: 120 },
      { nome: 'Z2 Base', min: 121, max: 146 },
      { nome: 'Z3 Limiar', min: 147, max: 162 },
    ],
    velocidades_treino: [
      { nome: 'Leve', min: 6.8, max: 8.2 },
      { nome: 'Moderado', min: 8.3, max: 9.6 },
      { nome: 'Intenso', min: 9.7, max: 11.2 },
    ],
  },
  forca: {
    preensao_dir_kgf: 32,
    preensao_esq_kgf: 30,
    assimetria_percent: 6.2,
    modelo_dinamometria: 'tracao',
    sptech_testes: [
      spTeste('Quadril', 'Abdução', 34, 31),
      spTeste('Ombro', 'Rotação externa', 18, 17),
      spTeste('Cotovelo', 'Flexão', 24, 22),
      spTeste('Peitoral', 'Adução horizontal', 30, 28),
      spTeste('Punho', 'Extensão', 16, 15),
      spTeste('Lombar', 'Extensão', 46, 44),
      spTeste('Cervical', 'Flexão', 11, 10),
      spTeste('Coluna', 'Flexão lateral D', 32, 30),
      spTeste('Tornozelo', 'Dorsiflexão', 22, 20),
      spTeste('Outra', 'Teste funcional específico', 27, 25),
      { articulacao: 'Joelho', movimento: 'Extensão', lado_d: { kgf: 38, torque_nm: 112 }, lado_e: { kgf: 35, torque_nm: 104 }, assimetria_pct: 7.9, classificacao_assimetria: 'Leve' },
    ],
    tracao_testes: [
      tracaoTeste('triceps_90', 'Tríceps 90°', 'Tríceps pulley / extensão unilateral', 0.70, 36, 34, 330, 350),
      tracaoTeste('peitoral_maior', 'Peitoral maior', 'Supino / chest press / crucifixo adaptado', 0.60, 54, 50, 390, 420),
      tracaoTeste('latissimo_dorso', 'Latíssimo do dorso', 'Remada unilateral / puxada', 0.75, 58, 53, 410, 445),
      tracaoTeste('isquiotibiais_30_45', 'Isquiotibiais 30°-45°', 'Mesa flexora / flexão de joelho', 0.60, 52, 48, 430, 455),
      tracaoTeste('imtp_130_140', 'IMTP 130°-140°', 'Deadlift / puxada / força global', 0.50, 128, 120, 510, 540),
      {
        teste: 'biceps_90',
        musculo: 'Bíceps 90°',
        exercicio_ref: 'Rosca direta / rosca unilateral',
        fator: '0.70',
        lado_d: { fim_kgf: '42', tempo_ms: '310', rm1_kg: '29.4', rfd_kgf_s: '135.5' },
        lado_e: { fim_kgf: '39', tempo_ms: '340', rm1_kg: '27.3', rfd_kgf_s: '114.7' },
        assimetria_pct: '7.1',
        classificacao_assimetria: 'Leve',
        observacoes: 'Boa simetria bilateral, com discreta vantagem do lado direito.',
      },
      {
        teste: 'quadriceps_90',
        musculo: 'Quadríceps 90°',
        exercicio_ref: 'Cadeira extensora / extensão de joelho',
        fator: '0.65',
        lado_d: { fim_kgf: '86', tempo_ms: '420', rm1_kg: '55.9', rfd_kgf_s: '204.8' },
        lado_e: { fim_kgf: '76', tempo_ms: '460', rm1_kg: '49.4', rfd_kgf_s: '165.2' },
        assimetria_pct: '11.6',
        classificacao_assimetria: 'Moderada',
        observacoes: 'Atenção para assimetria de quadríceps em tarefas de impacto.',
      },
    ],
    sptech_relacoes: [
      { nome: 'Isquiotibiais / Quadríceps', valor: 62, unidade: '%' },
      { nome: 'Direita / Esquerda', valor: 92, unidade: '%' },
    ],
  },
  flexibilidade: {
    melhor_resultado: 31,
    classificacao: 'Bom',
    tentativa_1: 29,
    tentativa_2: 31,
    tentativa_3: 30,
  },
  posturografia: {
    foto_anterior: fotoPostural('Anterior', '#10b981'),
    foto_posterior: fotoPostural('Posterior', '#0ea5e9'),
    foto_lateral_dir: fotoPostural('Lateral direita', '#f59e0b'),
    foto_lateral_esq: fotoPostural('Lateral esquerda', '#8b5cf6'),
    alinhamentos: {
      anteriorizacao_cabeca: true,
      ombro_direito_elevado: true,
      anteversao_pelve: false,
    },
  },
  rml: {
    categoria: 'jovem_ativo',
    mmss_modalidade: 'modificada',
    mmss_reps: 22,
    mmss_classificacao: 'Bom',
    abd_1min_reps: 34,
    abd_1min_classificacao: 'Bom',
    abd_prancha_seg: 78,
    abd_prancha_classificacao: 'Regular',
    mmii_agach_reps: 42,
    mmii_agach_classificacao: 'Bom',
  },
  biomecanica_corrida: {
    link_video: 'https://drive.google.com/file/d/exemplo-cinematica/view',
    angulos: {
      cabeca: { valor: -8, ideal_min: -13, ideal_max: -3, classificacao: 'ideal' },
      tronco: { valor: 16, ideal_min: 8, ideal_max: 14, classificacao: 'atencao' },
      aterrissagem_passada: { valor: 12, ideal_min: 0, ideal_max: 10, classificacao: 'atencao' },
      joelho_frente_contato: { valor: 150, ideal_min: 155, ideal_max: 175, classificacao: 'fora' },
      joelho_posterior_contato: { valor: 92, ideal_min: 80, ideal_max: 100, classificacao: 'ideal' },
      bracos: { valor: 91, ideal_min: 77, ideal_max: 87, classificacao: 'atencao' },
    },
    comentarios_angulos: {
      tronco: 'Inclinação anterior um pouco acima do ideal, sugerindo necessidade de controle de tronco durante a fase de apoio.',
      joelho_frente_contato: 'Menor extensão no contato inicial, compatível com maior demanda excêntrica no quadríceps.',
      bracos: 'Oscilação de braços acima da referência, sugerindo compensação rotacional de tronco.',
    },
    achados: {
      mecanica_frenagem: true,
      sobrecarga_articular: true,
      comentarios_risco: 'A associação entre passada longa e menor controle de tronco pode elevar a carga no contato inicial. Priorizar ajustes técnicos antes de aumentar volume ou intensidade.',
    },
    graficos: {
      joelho_url: grafico('red', '#b91c1c'),
      quadril_url: grafico('#22c55e', '#15803d'),
      cotovelo_url: grafico('#3b82f6', '#1d4ed8'),
    },
    comentarios_graficos: {
      geral: 'Os gráficos reforçam os achados angulares descritos na análise detalhada, principalmente na fase de contato inicial.',
    },
  },
  analises_ia: {
    rml: 'Boa resistência muscular geral, com atenção para endurance de core e controle técnico em exercícios repetitivos.',
  },
};

export const avaliacaoAnterior: any = {
  ...avaliacaoAtual,
  id: 'aval-2026-02',
  data: '2026-02-20',
  scores: {
    global: 70,
    postura: 61,
    composicao_corporal: 68,
    forca: 76,
    flexibilidade: 72,
    rml: 69,
    cardiorrespiratorio: 78,
  },
  antropometria: {
    ...avaliacaoAtual.antropometria,
    peso: 70.1,
    percentual_gordura: 29.2,
    massa_magra: 49.1,
    imc: 25.4,
  },
  bioimpedancia: {
    ...avaliacaoAtual.bioimpedancia,
    peso_kg: 70.1,
    percentual_gordura: 29.2,
    massa_livre_gordura_kg: 49.1,
  },
  cardiorrespiratorio: {
    ...avaliacaoAtual.cardiorrespiratorio,
    vo2max: 39.8,
  },
  forca: {
    ...avaliacaoAtual.forca,
    preensao_dir_kgf: 29,
    preensao_esq_kgf: 28,
  },
  flexibilidade: {
    ...avaliacaoAtual.flexibilidade,
    melhor_resultado: 27,
    classificacao: 'Regular',
  },
  biomecanica_corrida: undefined,
};

const html = renderToStaticMarkup(
  <PortalPaciente
    paciente={{ nome: 'Marina Costa', sexo: 'F', data_nascimento: '1989-08-12', cpf: '000.000.000-00' }}
    avaliador={{ nome: 'Dr. Rafael Almeida', conselho: 'CREF 000000-G/SP' }}
    avaliacoes={[avaliacaoAnterior, avaliacaoAtual]}
  />
);

const doc = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Prévia - Dashboard do Cliente</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef3f2; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    button, select { font-family: inherit; }
  </style>
</head>
<body>${html}</body>
</html>`;

const out = resolve('preview-dashboard-cliente.html');
writeFileSync(out, doc, 'utf8');
console.log(out);
