import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderLaudoHTML, type LaudoData } from '../src/lib/pdf/template';

const svgDataUrl = (svg: string) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const fotoPostural = (titulo: string, cor = '#059669') => svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#e2e8f0"/></linearGradient></defs>
  <rect width="720" height="1080" fill="url(#bg)"/>
  <rect x="64" y="72" width="592" height="936" rx="28" fill="#fff" stroke="#cbd5e1" stroke-width="4"/>
  <line x1="360" y1="130" x2="360" y2="930" stroke="${cor}" stroke-width="5" stroke-dasharray="18 16" opacity=".6"/>
  <circle cx="360" cy="245" r="58" fill="${cor}" opacity=".85"/>
  <path d="M315 326 C300 430 292 562 305 710 C312 790 322 880 337 948" fill="none" stroke="${cor}" stroke-width="44" stroke-linecap="round"/>
  <path d="M405 326 C420 430 428 562 415 710 C408 790 398 880 383 948" fill="none" stroke="${cor}" stroke-width="44" stroke-linecap="round"/>
  <path d="M280 410 C210 520 208 650 246 760" fill="none" stroke="${cor}" stroke-width="34" stroke-linecap="round" opacity=".85"/>
  <path d="M440 410 C510 520 512 650 474 760" fill="none" stroke="${cor}" stroke-width="34" stroke-linecap="round" opacity=".85"/>
  <text x="360" y="1038" text-anchor="middle" font-family="Inter,Arial" font-size="34" font-weight="800" fill="#334155">${titulo}</text>
</svg>`);

const spLado = (kgf: number, torque: number) => ({
  kgf,
  torque_nm: torque,
  rm1_kg: +(kgf * 0.78).toFixed(1),
  cargas: {
    resistencia_min: +(kgf * 0.42).toFixed(1), resistencia_max: +(kgf * 0.50).toFixed(1),
    forca_min: +(kgf * 0.72).toFixed(1), forca_max: +(kgf * 0.86).toFixed(1),
    potencia_min: +(kgf * 0.45).toFixed(1), potencia_max: +(kgf * 0.60).toFixed(1),
    hipertrofia_min: +(kgf * 0.62).toFixed(1), hipertrofia_max: +(kgf * 0.74).toFixed(1),
    velocidade_min: +(kgf * 0.28).toFixed(1),
  },
});

const spTeste = (articulacao: string, movimento: string, d: number, e: number) => {
  const assim = +((Math.abs(d - e) / Math.max(d, e)) * 100).toFixed(1);
  return {
    articulacao,
    movimento,
    lateralidade: ['Lombar', 'Cervical', 'Coluna'].includes(articulacao) ? 'bilateral' : 'bilateral',
    lado_d: spLado(d, +(d * 2.68).toFixed(1)),
    lado_e: spLado(e, +(e * 2.68).toFixed(1)),
    assimetria_pct: String(assim),
    classificacao_assimetria: assim < 10 ? 'Leve' : assim < 15 ? 'Moderada' : 'Alta',
  };
};

const tracaoTeste = (teste: string, musculo: string, exercicio_ref: string, fator: number, d: number, e: number, td = 380, te = 410) => {
  const assim = +((Math.abs(d - e) / Math.max(d, e)) * 100).toFixed(1);
  return {
    teste,
    musculo,
    exercicio_ref,
    fator: String(fator),
    lado_d: { fim_kgf: String(d), tempo_ms: String(td), rm1_kg: (d * fator).toFixed(1), rfd_kgf_s: (d / (td / 1000)).toFixed(1) },
    lado_e: { fim_kgf: String(e), tempo_ms: String(te), rm1_kg: (e * fator).toFixed(1), rfd_kgf_s: (e / (te / 1000)).toFixed(1) },
    assimetria_pct: String(assim),
    classificacao_assimetria: assim < 10 ? 'Leve' : assim < 15 ? 'Moderada' : 'Alta',
    observacoes: `Teste simulado completo para ${musculo}, com cálculo de 1RM, assimetria e RFD.`,
  };
};

export const dados: LaudoData = {
  clinica: {
    nome: 'Clínica Movimento Integrado',
    cor_primaria: '#059669',
    cor_gradient_1: '#052e16',
    cor_gradient_2: '#059669',
    cor_gradient_3: '#67e8f9',
    telefone: '(11) 99999-0000',
    email: 'contato@movimentointegrado.com.br',
    site: 'medfit.med.br',
  },
  paciente: {
    nome: 'Marina Costa',
    sexo: 'F',
    data_nascimento: '1989-08-12',
    idade: 36,
    cpf: '000.000.000-00',
  },
  avaliador: {
    nome: 'Dr. Rafael Almeida',
    conselho: 'CREF 000000-G/SP',
  },
  avaliacao: {
    data: '2026-04-27',
    tipo: 'Diagnóstico completo',
  },
  modulos: {
    anamnese: true,
    sinais_vitais: true,
    posturografia: true,
    bioimpedancia: true,
    antropometria: true,
    flexibilidade: true,
    forca: true,
    rml: true,
    cardiorrespiratorio: true,
    biomecanica_corrida: true,
  },
  dados: {
    anamnese: {
      respostas: {
        objetivo: 'Reduzir gordura corporal, melhorar condicionamento e prevenir dores lombares.',
        sono: '6 a 7 horas por noite',
        historico: 'Sem lesões recentes. Relata desconforto lombar após longos períodos sentada.',
      },
      _campos: [
        { id: 'objetivo', label: 'Objetivo principal', tipo: 'texto_longo' },
        { id: 'sono', label: 'Sono', tipo: 'texto' },
        { id: 'historico', label: 'Histórico relevante', tipo: 'texto_longo' },
      ],
    },
    sinais_vitais: {
      pa_sistolica: 118,
      pa_diastolica: 76,
      fc_repouso: 62,
      spo2: 98,
      temperatura: 36.4,
      freq_respiratoria: 14,
    },
    posturografia: {
      foto_anterior: fotoPostural('Anterior', '#10b981'),
      foto_posterior: fotoPostural('Posterior', '#0ea5e9'),
      foto_lateral_dir: fotoPostural('Lateral direita', '#f59e0b'),
      foto_lateral_esq: fotoPostural('Lateral esquerda', '#8b5cf6'),
      alinhamentos: {
        cabeca_anteriorizada: true,
        hiperlordose_lombar: true,
        assimetria_pelvica: true,
      },
      observacoes: 'Leve anteriorização de cabeça e tendência à anteversão pélvica.',
    },
    bioimpedancia: {
      aparelho: 'InBody 570',
      peso_kg: 68.4,
      percentual_gordura: 27.8,
      massa_gordura_kg: 19.0,
      massa_livre_gordura_kg: 49.4,
      agua_corporal_kg: 35.8,
      imc: 24.8,
      taxa_metabolica_basal_kcal: 1420,
      indice_apendicular: 6.7,
      idade_metabolica: 34,
      gordura_visceral_nivel: 8,
      segmentar_magra: {
        braco_dir: { kg: 2.4, pct: 96 },
        braco_esq: { kg: 2.3, pct: 94 },
        tronco: { kg: 22.1, pct: 98 },
        perna_dir: { kg: 7.4, pct: 101 },
        perna_esq: { kg: 7.2, pct: 99 },
      },
      segmentar_gordura: {
        braco_dir: { kg: 1.1, pct: 25 },
        braco_esq: { kg: 1.1, pct: 25 },
        tronco: { kg: 9.8, pct: 30 },
        perna_dir: { kg: 3.5, pct: 27 },
        perna_esq: { kg: 3.5, pct: 27 },
      },
    },
    antropometria: {
      peso: 68.4,
      estatura: 166,
      imc: 24.8,
      percentual_gordura: 26.9,
      massa_magra: 50.0,
      massa_ossea: 2.7,
      rcq: 0.78,
      ffmi: 18.1,
      dobras: {
        triceps: { m1: 18, m2: 17, m3: null, media: 17.5 },
        subescapular: { m1: 14, m2: 15, m3: null, media: 14.5 },
        peitoral: { m1: 11, m2: 12, m3: null, media: 11.5 },
        axilar_media: { m1: 16, m2: 16, m3: null, media: 16 },
        supra_iliaca: { m1: 19, m2: 20, m3: null, media: 19.5 },
        abdominal: { m1: 24, m2: 25, m3: null, media: 24.5 },
        coxa: { m1: 28, m2: 27, m3: null, media: 27.5 },
      },
      circunferencias: {
        pescoco: 33,
        ombro: 102,
        torax: 88,
        cintura: 72,
        abdome: 84,
        quadril: 92,
        braco_dir_relaxado: 28.2,
        braco_esq_relaxado: 27.9,
        panturrilha_dir: 36.5,
        panturrilha_esq: 36.1,
      },
      somatotipo: { endomorfia: 4.1, mesomorfia: 3.7, ectomorfia: 1.9, classificacao: 'Endo-mesomorfo' },
    },
    flexibilidade: {
      tentativa_1: 28.5,
      tentativa_2: 31.0,
      tentativa_3: 30.2,
      melhor_resultado: 31.0,
      classificacao: 'Bom',
      observacoes: 'Sem dor durante o teste.',
    },
    forca: {
      preensao_dir_kgf: 31.2,
      preensao_esq_kgf: 29.8,
      assimetria_percent: 4.5,
      forca_relativa_dir: 0.456,
      forca_relativa_esq: 0.436,
      modelo_dinamometria: 'tracao',
      sptech_testes: [
        {
          articulacao: 'Joelho',
          movimento: 'Extensão',
          lado_d: { kgf: 42, torque_nm: 112, cargas: { forca_min: 28, forca_max: 34 } },
          lado_e: { kgf: 39, torque_nm: 106, cargas: { forca_min: 26, forca_max: 32 } },
          assimetria_pct: '7.1',
          classificacao_assimetria: 'Leve',
        },
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
      ],
      tracao_testes: [
        tracaoTeste('biceps_90', 'Bíceps 90°', 'Rosca direta / rosca unilateral', 0.70, 42, 39, 310, 340),
        tracaoTeste('triceps_90', 'Tríceps 90°', 'Tríceps pulley / extensão unilateral', 0.70, 36, 34, 330, 350),
        tracaoTeste('peitoral_maior', 'Peitoral maior', 'Supino / chest press / crucifixo adaptado', 0.60, 54, 50, 390, 420),
        tracaoTeste('latissimo_dorso', 'Latíssimo do dorso', 'Remada unilateral / puxada', 0.75, 58, 53, 410, 445),
        tracaoTeste('isquiotibiais_30_45', 'Isquiotibiais 30°-45°', 'Mesa flexora / flexão de joelho', 0.60, 52, 48, 430, 455),
        tracaoTeste('imtp_130_140', 'IMTP 130°-140°', 'Deadlift / puxada / força global', 0.50, 128, 120, 510, 540),
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
        { descricao: 'Isquiotibiais / Quadríceps', percentual: '62' },
        { descricao: 'Direita / Esquerda global', percentual: '93' },
        { descricao: 'Rotadores externos / internos do ombro', percentual: '72' },
      ],
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
      score: 76,
    },
    cardiorrespiratorio: {
      protocolo: 'Esteira',
      vo2max: 41.2,
      classificacao_vo2: 'Bom',
      fc_max: 184,
      fc_repouso: 62,
      fc_limiar: 156,
      l2: 9.8,
      vam: 12.4,
      zonas: {
        z1: { min: 92, max: 110 },
        z2: { min: 111, max: 129 },
        z3: { min: 130, max: 147 },
        z4: { min: 148, max: 166 },
        z5: { min: 167, max: 184 },
      },
    },
    biomecanica_corrida: {
      velocidade_kmh: 10,
      movimento: 'Corrida em esteira',
      link_video: 'https://drive.google.com/file/d/exemplo-cinematica/view',
      metricas: {
        tempo_voo_s: 0.18,
        tempo_contato_solo_s: 0.24,
        frequencia_passos_ppm: 172,
        comprimento_passo_m: 0.97,
        comprimento_passada_m: 1.94,
        fator_esforco_pct: 42,
        fator_esforco_tipo: 'aéreo',
      },
      angulos: {
        cabeca: { valor: -8, ideal_min: -13, ideal_max: -3, classificacao: 'ideal' },
        tronco: { valor: 16, ideal_min: 8, ideal_max: 14, classificacao: 'atencao' },
        aterrissagem_passada: { valor: 12, ideal_min: 0, ideal_max: 10, classificacao: 'atencao' },
        joelho_frente_contato: { valor: 150, ideal_min: 155, ideal_max: 175, classificacao: 'fora' },
        joelho_posterior_contato: { valor: 92, ideal_min: 80, ideal_max: 100, classificacao: 'ideal' },
        bracos: { valor: 91, ideal_min: 77, ideal_max: 87, classificacao: 'atencao' },
        queda_pelve_esq: { valor: 6, ideal_min: 0, ideal_max: 5, classificacao: 'atencao' },
        queda_pelve_dir: { valor: 3, ideal_min: 0, ideal_max: 5, classificacao: 'ideal' },
        alinhamento_joelho_esq: { valor: -7, ideal_min: -5, ideal_max: 5, classificacao: 'atencao' },
        alinhamento_joelho_dir: { valor: 2, ideal_min: -5, ideal_max: 5, classificacao: 'ideal' },
        pronacao_supinacao_esq: { valor: 10, ideal_min: -5, ideal_max: 8, classificacao: 'atencao' },
        pronacao_supinacao_dir: { valor: 4, ideal_min: -5, ideal_max: 8, classificacao: 'ideal' },
      },
      comentarios_angulos: {
        cabeca: 'Cabeça levemente projetada para frente, mas ainda dentro da faixa esperada para a fase analisada.',
        tronco: 'Inclinação anterior um pouco acima do ideal, sugerindo necessidade de controle de tronco durante a fase de apoio.',
        aterrissagem_passada: 'Contato inicial com tendência discreta a passada longa, aumentando a frenagem no início do apoio.',
        joelho_frente_contato: 'Menor extensão do joelho no contato inicial, compatível com maior demanda excêntrica no quadríceps.',
        bracos: 'Oscilação de braços acima da referência, sugerindo compensação rotacional de tronco.',
      },
      graficos: {
        joelho_url: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="544" height="443"><rect width="100%" height="100%" fill="#050505"/><line x1="58" y1="390" x2="520" y2="390" stroke="#4b5563"/><line x1="58" y1="16" x2="58" y2="390" stroke="#4b5563"/><text x="25" y="377" fill="#7c8794" font-size="14">0°</text><text x="22" y="291" fill="#7c8794" font-size="14">30°</text><text x="22" y="204" fill="#7c8794" font-size="14">60°</text><text x="22" y="121" fill="#7c8794" font-size="14">90°</text><text x="16" y="38" fill="#7c8794" font-size="14">120°</text><text x="70" y="408" fill="#7c8794" font-size="14">0%</text><text x="168" y="408" fill="#7c8794" font-size="14">25%</text><text x="278" y="408" fill="#7c8794" font-size="14">50%</text><text x="389" y="408" fill="#7c8794" font-size="14">75%</text><text x="492" y="408" fill="#7c8794" font-size="14">100%</text><text x="245" y="428" fill="#7c8794" font-size="14">Ciclo de corrida (%)</text><text x="16" y="238" fill="#7c8794" font-size="14" transform="rotate(-90 16 238)">Ângulo (°)</text><polyline points="70,242 92,205 122,185 153,190 184,226 220,283 254,286 289,244 324,197 360,146 389,84 421,61 453,90 484,179 510,252" fill="none" stroke="red" stroke-width="3"/><polyline points="70,273 98,238 132,204 162,216 196,260 227,287 260,282 296,234 331,185 370,137 402,70 432,71 466,132 494,249 520,291" fill="none" stroke="#b91c1c" stroke-width="2"/></svg>'),
        quadril_url: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="544" height="443"><rect width="100%" height="100%" fill="#050505"/><line x1="58" y1="390" x2="520" y2="390" stroke="#4b5563"/><line x1="58" y1="16" x2="58" y2="390" stroke="#4b5563"/><text x="25" y="377" fill="#7c8794" font-size="14">0°</text><text x="22" y="291" fill="#7c8794" font-size="14">30°</text><text x="22" y="204" fill="#7c8794" font-size="14">60°</text><text x="22" y="121" fill="#7c8794" font-size="14">90°</text><text x="16" y="38" fill="#7c8794" font-size="14">120°</text><text x="245" y="428" fill="#7c8794" font-size="14">Ciclo de corrida (%)</text><polyline points="70,300 118,245 168,210 220,188 270,165 322,151 378,166 430,202 482,251 520,295" fill="none" stroke="#22c55e" stroke-width="3"/><polyline points="70,318 120,260 172,230 225,198 280,176 332,169 386,184 438,220 489,270 520,306" fill="none" stroke="#15803d" stroke-width="2"/></svg>'),
        cotovelo_url: svgDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="544" height="443"><rect width="100%" height="100%" fill="#050505"/><line x1="58" y1="390" x2="520" y2="390" stroke="#4b5563"/><line x1="58" y1="16" x2="58" y2="390" stroke="#4b5563"/><text x="25" y="377" fill="#7c8794" font-size="14">0°</text><text x="22" y="291" fill="#7c8794" font-size="14">30°</text><text x="22" y="204" fill="#7c8794" font-size="14">60°</text><text x="22" y="121" fill="#7c8794" font-size="14">90°</text><text x="16" y="38" fill="#7c8794" font-size="14">120°</text><text x="245" y="428" fill="#7c8794" font-size="14">Ciclo de corrida (%)</text><polyline points="70,210 118,138 170,164 220,214 275,238 328,221 383,186 438,130 490,152 520,177" fill="none" stroke="#3b82f6" stroke-width="3"/><polyline points="70,235 120,160 172,178 224,224 278,250 332,236 388,198 444,145 492,166 520,191" fill="none" stroke="#1d4ed8" stroke-width="2"/></svg>'),
      },
      comentarios_graficos: {
        geral: 'Os gráficos reforçam os achados angulares descritos na análise detalhada, principalmente na fase de contato inicial e na oscilação dos membros superiores.',
      },
      achados: {
        mecanica_frenagem: true,
        sobrecarga_articular: true,
        comentarios_risco: 'A associação entre passada longa e menor controle de tronco pode elevar a carga no contato inicial. Priorizar ajustes técnicos antes de aumentar volume ou intensidade.',
        observacoes: 'Tendência discreta a overstride no contato inicial.',
      },
    },
  },
  scores: {
    global: 78,
    postura: 67,
    composicao_corporal: 74,
    forca: 82,
    flexibilidade: 80,
    rml: 76,
    cardiorrespiratorio: 84,
  },
  analisesIA: {
    conclusao_global: {
      resumo_executivo: 'A avaliação indica bom condicionamento geral, com oportunidades claras de melhora em controle postural, composição corporal e resistência de core.',
      pontos_fortes: ['Boa capacidade cardiorrespiratória', 'Força preservada e baixa assimetria', 'Flexibilidade satisfatória'],
      pontos_criticos: ['Gordura corporal acima do ideal atlético', 'Sinais de sobrecarga lombopélvica', 'Core com resistência moderada'],
      prioridades: [
        { titulo: 'Controle lombopélvico', acao: 'Fortalecer core profundo e glúteos com progressão técnica.', prazo: '4 a 6 semanas' },
        { titulo: 'Composição corporal', acao: 'Ajustar rotina de força e cardio com déficit calórico leve.', prazo: '8 a 12 semanas' },
        { titulo: 'Técnica de corrida', acao: 'Reduzir overstride e melhorar cadência.', prazo: '6 semanas' },
      ],
      mensagem_paciente: 'Você já parte de uma base muito boa. Com ajustes consistentes, a evolução tende a aparecer rápido nos próximos ciclos.',
    },
    antropometria: {
      interpretacao: 'Composição corporal compatível com perfil ativo recreacional, porém ainda há margem para redução de gordura e ganho de eficiência metabólica.',
      recomendacoes: ['Treino de força 3x/semana', 'Proteína adequada distribuída ao longo do dia', 'Reavaliação em 8 semanas'],
    },
    cardiorrespiratorio: {
      interpretacao: 'VO2max em boa faixa para sexo e idade, com zonas úteis para prescrição aeróbica.',
      recomendacoes: ['Manter 70% do volume em Z1-Z2', 'Inserir um estímulo intervalado semanal em Z4'],
    },
    rml: {
      texto_editado: 'A resistência muscular está adequada, com maior atenção para sustentação de core em exercícios prolongados.',
    },
  },
};

const html = renderLaudoHTML(dados);
const out = resolve('preview-laudo.html');
writeFileSync(out, html, 'utf8');
console.log(out);
