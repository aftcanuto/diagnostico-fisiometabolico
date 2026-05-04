/**
 * RML — Tabelas de referência e cálculos de classificação
 * Fontes: ACSM, Pollock & Wilmore, Matsudo, Rikli & Jones, YMCA, McGill
 */

export type CategoriaRML = 'jovem_ativo' | 'idoso';
export type ClassificacaoRML = 'Excelente' | 'Bom' | 'Regular' | 'Fraco' | 'Muito fraco';

// ── Flexão de braço (ACSM / Pollock & Wilmore) ────────────────────────────────
// Tradicional (homens) e modificada (mulheres)
// Faixas: 20-29 | 30-39 | 40-49 | 50-59 | 60-69
// [Excelente, Bom, Regular, Fraco, Muito fraco] = limites INFERIORES de cada faixa
interface FaixaFlexao {
  faixa: [number, number];  // [min_idade, max_idade]
  excelente: number;
  bom: number;
  regular: number;
  fraco: number;
}

const FLEXAO_TRADICIONAL_M: FaixaFlexao[] = [
  { faixa: [15, 19], excelente: 39, bom: 29, regular: 23, fraco: 18 },
  { faixa: [20, 29], excelente: 36, bom: 29, regular: 22, fraco: 17 },
  { faixa: [30, 39], excelente: 30, bom: 24, regular: 17, fraco: 12 },
  { faixa: [40, 49], excelente: 25, bom: 18, regular: 13, fraco:  9 },
  { faixa: [50, 59], excelente: 21, bom: 13, regular:  9, fraco:  6 },
  { faixa: [60, 99], excelente: 18, bom: 10, regular:  7, fraco:  4 },
];

const FLEXAO_MODIFICADA_F: FaixaFlexao[] = [
  { faixa: [15, 19], excelente: 33, bom: 25, regular: 18, fraco: 12 },
  { faixa: [20, 29], excelente: 30, bom: 21, regular: 15, fraco: 10 },
  { faixa: [30, 39], excelente: 27, bom: 20, regular: 13, fraco:  8 },
  { faixa: [40, 49], excelente: 24, bom: 15, regular: 11, fraco:  5 },
  { faixa: [50, 59], excelente: 21, bom: 13, regular:  7, fraco:  2 },
  { faixa: [60, 99], excelente: 17, bom: 11, regular:  5, fraco:  1 },
];

// ── Abdominal 1 minuto (ACSM / Pollock) ───────────────────────────────────────
const ABDOMINAL_M: FaixaFlexao[] = [
  { faixa: [15, 19], excelente: 48, bom: 42, regular: 38, fraco: 33 },
  { faixa: [20, 29], excelente: 43, bom: 37, regular: 33, fraco: 29 },
  { faixa: [30, 39], excelente: 36, bom: 31, regular: 27, fraco: 22 },
  { faixa: [40, 49], excelente: 31, bom: 26, regular: 22, fraco: 17 },
  { faixa: [50, 59], excelente: 26, bom: 22, regular: 18, fraco: 13 },
  { faixa: [60, 99], excelente: 23, bom: 17, regular: 13, fraco:  9 },
];

const ABDOMINAL_F: FaixaFlexao[] = [
  { faixa: [15, 19], excelente: 45, bom: 37, regular: 31, fraco: 25 },
  { faixa: [20, 29], excelente: 36, bom: 31, regular: 25, fraco: 18 },
  { faixa: [30, 39], excelente: 31, bom: 26, regular: 19, fraco: 14 },
  { faixa: [40, 49], excelente: 26, bom: 22, regular: 14, fraco:  9 },
  { faixa: [50, 59], excelente: 22, bom: 18, regular: 10, fraco:  5 },
  { faixa: [60, 99], excelente: 17, bom: 12, regular:  6, fraco:  2 },
];

// ── Prancha ventral — McGill (2007) / ACSM ────────────────────────────────────
// Valores em segundos
const PRANCHA_M: FaixaFlexao[] = [
  { faixa: [18, 29], excelente: 180, bom: 120, regular: 60, fraco: 30 },
  { faixa: [30, 39], excelente: 150, bom: 100, regular: 55, fraco: 25 },
  { faixa: [40, 49], excelente: 120, bom:  90, regular: 45, fraco: 20 },
  { faixa: [50, 59], excelente:  90, bom:  70, regular: 35, fraco: 15 },
  { faixa: [60, 99], excelente:  75, bom:  55, regular: 25, fraco: 10 },
];

const PRANCHA_F: FaixaFlexao[] = [
  { faixa: [18, 29], excelente: 150, bom: 100, regular: 50, fraco: 25 },
  { faixa: [30, 39], excelente: 120, bom:  85, regular: 45, fraco: 20 },
  { faixa: [40, 49], excelente: 100, bom:  70, regular: 35, fraco: 15 },
  { faixa: [50, 59], excelente:  80, bom:  55, regular: 25, fraco: 10 },
  { faixa: [60, 99], excelente:  60, bom:  40, regular: 20, fraco:  8 },
];

// ── Agachamento livre 1 minuto (ACSM / Matsudo) ───────────────────────────────
const AGACHAMENTO_M: FaixaFlexao[] = [
  { faixa: [15, 19], excelente: 50, bom: 42, regular: 35, fraco: 27 },
  { faixa: [20, 29], excelente: 48, bom: 40, regular: 33, fraco: 25 },
  { faixa: [30, 39], excelente: 42, bom: 34, regular: 28, fraco: 21 },
  { faixa: [40, 49], excelente: 35, bom: 28, regular: 22, fraco: 15 },
  { faixa: [50, 59], excelente: 28, bom: 22, regular: 17, fraco: 11 },
  { faixa: [60, 99], excelente: 22, bom: 17, regular: 12, fraco:  8 },
];

const AGACHAMENTO_F: FaixaFlexao[] = [
  { faixa: [15, 19], excelente: 45, bom: 37, regular: 30, fraco: 23 },
  { faixa: [20, 29], excelente: 43, bom: 35, regular: 28, fraco: 21 },
  { faixa: [30, 39], excelente: 37, bom: 29, regular: 23, fraco: 17 },
  { faixa: [40, 49], excelente: 30, bom: 23, regular: 17, fraco: 11 },
  { faixa: [50, 59], excelente: 24, bom: 18, regular: 13, fraco:  8 },
  { faixa: [60, 99], excelente: 18, bom: 13, regular:  9, fraco:  5 },
];

// ── Sentar e Levantar 30s — Rikli & Jones (2013) ─────────────────────────────
// Idosos — [faixa_etaria, [Abaixo méd, Médio baixo, Médio, Médio alto, Acima méd]]
interface FaixaIdoso {
  faixa: [number, number];
  excelente: number;
  bom: number;
  regular: number;
  fraco: number;
}

const SENTAR_LEVANTAR_M: FaixaIdoso[] = [
  { faixa: [60, 64], excelente: 19, bom: 16, regular: 14, fraco: 12 },
  { faixa: [65, 69], excelente: 18, bom: 15, regular: 12, fraco: 10 },
  { faixa: [70, 74], excelente: 17, bom: 14, regular: 12, fraco: 10 },
  { faixa: [75, 79], excelente: 16, bom: 13, regular: 11, fraco:  9 },
  { faixa: [80, 84], excelente: 15, bom: 12, regular: 10, fraco:  8 },
  { faixa: [85, 99], excelente: 14, bom: 11, regular:  8, fraco:  6 },
];

const SENTAR_LEVANTAR_F: FaixaIdoso[] = [
  { faixa: [60, 64], excelente: 17, bom: 14, regular: 12, fraco: 10 },
  { faixa: [65, 69], excelente: 16, bom: 13, regular: 11, fraco:  9 },
  { faixa: [70, 74], excelente: 15, bom: 12, regular: 10, fraco:  9 },
  { faixa: [75, 79], excelente: 14, bom: 12, regular: 10, fraco:  8 },
  { faixa: [80, 84], excelente: 13, bom: 11, regular:  9, fraco:  7 },
  { faixa: [85, 99], excelente: 12, bom:  9, regular:  7, fraco:  5 },
];

// ── Arm Curl Test 30s — Rikli & Jones (2013) ─────────────────────────────────
const ARM_CURL_M: FaixaIdoso[] = [
  { faixa: [60, 64], excelente: 22, bom: 19, regular: 16, fraco: 13 },
  { faixa: [65, 69], excelente: 21, bom: 18, regular: 15, fraco: 12 },
  { faixa: [70, 74], excelente: 20, bom: 17, regular: 14, fraco: 11 },
  { faixa: [75, 79], excelente: 19, bom: 16, regular: 13, fraco: 10 },
  { faixa: [80, 84], excelente: 18, bom: 15, regular: 12, fraco:  9 },
  { faixa: [85, 99], excelente: 17, bom: 14, regular: 11, fraco:  8 },
];

const ARM_CURL_F: FaixaIdoso[] = [
  { faixa: [60, 64], excelente: 20, bom: 17, regular: 13, fraco: 10 },
  { faixa: [65, 69], excelente: 19, bom: 16, regular: 12, fraco:  9 },
  { faixa: [70, 74], excelente: 18, bom: 15, regular: 12, fraco:  9 },
  { faixa: [75, 79], excelente: 17, bom: 14, regular: 11, fraco:  8 },
  { faixa: [80, 84], excelente: 16, bom: 13, regular: 10, fraco:  7 },
  { faixa: [85, 99], excelente: 15, bom: 12, regular:  9, fraco:  6 },
];

// ── Algoritmo de classificação ────────────────────────────────────────────────
function getFaixa<T extends { faixa: [number, number] }>(tabela: T[], idade: number): T | null {
  return tabela.find(f => idade >= f.faixa[0] && idade <= f.faixa[1]) ?? null;
}

function classificar(valor: number, faixa: FaixaFlexao | FaixaIdoso): ClassificacaoRML {
  if (valor >= faixa.excelente) return 'Excelente';
  if (valor >= faixa.bom)       return 'Bom';
  if (valor >= faixa.regular)   return 'Regular';
  if (valor >= faixa.fraco)     return 'Fraco';
  return 'Muito fraco';
}

function scoreClasse(c: ClassificacaoRML): number {
  const map: Record<ClassificacaoRML, number> = {
    'Excelente': 100, 'Bom': 80, 'Regular': 60, 'Fraco': 40, 'Muito fraco': 20,
  };
  return map[c];
}

// ── API pública ───────────────────────────────────────────────────────────────
export interface RMLInput {
  categoria: CategoriaRML;
  sexo: 'M' | 'F';
  idade: number;
  // jovem/ativo
  mmss_modalidade?: 'tradicional' | 'modificada';
  mmss_reps?: number;
  abd_1min_reps?: number;
  abd_prancha_seg?: number;
  mmii_agach_reps?: number;
  mmii_wallsit_seg?: number;
  // idoso
  idoso_sl_reps?: number;
  idoso_armcurl_reps?: number;
}

export interface RMLResult {
  mmss_classificacao?: ClassificacaoRML;
  abd_1min_classificacao?: ClassificacaoRML;
  abd_prancha_classificacao?: ClassificacaoRML;
  mmii_agach_classificacao?: ClassificacaoRML;
  mmii_wallsit_classificacao?: ClassificacaoRML;
  idoso_sl_classificacao?: ClassificacaoRML;
  idoso_armcurl_classificacao?: ClassificacaoRML;
  score: number;
}

export function calcularRML(input: RMLInput): RMLResult {
  const { categoria, sexo, idade } = input;
  const result: RMLResult = { score: 0 };
  const scores: number[] = [];

  if (categoria === 'jovem_ativo') {
    // MMSS
    if (input.mmss_reps != null) {
      const tbl = sexo === 'M' ? FLEXAO_TRADICIONAL_M : FLEXAO_MODIFICADA_F;
      const f = getFaixa(tbl, idade);
      if (f) {
        result.mmss_classificacao = classificar(input.mmss_reps, f);
        scores.push(scoreClasse(result.mmss_classificacao));
      }
    }
    // Abdominal 1min
    if (input.abd_1min_reps != null) {
      const tbl = sexo === 'M' ? ABDOMINAL_M : ABDOMINAL_F;
      const f = getFaixa(tbl, idade);
      if (f) {
        result.abd_1min_classificacao = classificar(input.abd_1min_reps, f);
        scores.push(scoreClasse(result.abd_1min_classificacao));
      }
    }
    // Prancha
    if (input.abd_prancha_seg != null) {
      const tbl = sexo === 'M' ? PRANCHA_M : PRANCHA_F;
      const f = getFaixa(tbl, idade);
      if (f) {
        result.abd_prancha_classificacao = classificar(input.abd_prancha_seg, f);
        scores.push(scoreClasse(result.abd_prancha_classificacao));
      }
    }
    // MMII agachamento
    if (input.mmii_agach_reps != null) {
      const tbl = sexo === 'M' ? AGACHAMENTO_M : AGACHAMENTO_F;
      const f = getFaixa(tbl, idade);
      if (f) {
        result.mmii_agach_classificacao = classificar(input.mmii_agach_reps, f);
        scores.push(scoreClasse(result.mmii_agach_classificacao));
      }
    }
    // Wall sit — apenas para tempo (sem tabela normativa formal, usar referências empíricas)
    if (input.mmii_wallsit_seg != null) {
      const s = input.mmii_wallsit_seg;
      const c: ClassificacaoRML =
        s >= 120 ? 'Excelente' :
        s >= 90  ? 'Bom' :
        s >= 60  ? 'Regular' :
        s >= 30  ? 'Fraco' : 'Muito fraco';
      result.mmii_wallsit_classificacao = c;
      scores.push(scoreClasse(c));
    }
  } else {
    // Idoso
    if (input.idoso_sl_reps != null) {
      const tbl = sexo === 'M' ? SENTAR_LEVANTAR_M : SENTAR_LEVANTAR_F;
      const f = getFaixa(tbl, idade);
      if (f) {
        result.idoso_sl_classificacao = classificar(input.idoso_sl_reps, f);
        scores.push(scoreClasse(result.idoso_sl_classificacao));
      }
    }
    if (input.idoso_armcurl_reps != null) {
      const tbl = sexo === 'M' ? ARM_CURL_M : ARM_CURL_F;
      const f = getFaixa(tbl, idade);
      if (f) {
        result.idoso_armcurl_classificacao = classificar(input.idoso_armcurl_reps, f);
        scores.push(scoreClasse(result.idoso_armcurl_classificacao));
      }
    }
  }

  result.score = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  return result;
}

// Cor por classificação
export function corClassificacao(c?: ClassificacaoRML | null): string {
  if (!c) return '#6b7280';
  const map: Record<ClassificacaoRML, string> = {
    'Excelente':   '#10b981',
    'Bom':         '#3b82f6',
    'Regular':     '#f59e0b',
    'Fraco':       '#f97316',
    'Muito fraco': '#ef4444',
  };
  return map[c];
}

// Tabelas de referência por teste (para exibição no relatório/dashboard)
export const REFERENCIAS_RML = {
  flexao_tradicional_m: FLEXAO_TRADICIONAL_M,
  flexao_modificada_f:  FLEXAO_MODIFICADA_F,
  abdominal_m:          ABDOMINAL_M,
  abdominal_f:          ABDOMINAL_F,
  prancha_m:            PRANCHA_M,
  prancha_f:            PRANCHA_F,
  agachamento_m:        AGACHAMENTO_M,
  agachamento_f:        AGACHAMENTO_F,
  sentar_levantar_m:    SENTAR_LEVANTAR_M,
  sentar_levantar_f:    SENTAR_LEVANTAR_F,
  arm_curl_m:           ARM_CURL_M,
  arm_curl_f:           ARM_CURL_F,
} as const;

export const FONTES_RML = [
  'ACSM\'s Guidelines for Exercise Testing and Prescription, 11ª ed. (2022)',
  'Pollock ML, Wilmore JH. Exercise in Health and Disease, 2ª ed. (1990)',
  'Rikli RE, Jones CJ. Senior Fitness Test Manual, 2ª ed. (2013)',
  'McGill SM. Low Back Disorders: Evidence-Based Prevention and Rehabilitation, 2ª ed. (2007)',
  'Matsudo SMM. Envelhecimento & Atividade Física. Midiograf (2001)',
  'Matsudo VKR et al. Tabelas de referência para aptidão física. Rev Bras Ativ Fís Saúde (1997)',
];

export const PROTOCOLOS_RML = {
  flexao_tradicional: {
    nome: 'Flexão de braço — tradicional',
    descricao: 'Posição de pranchas com joelhos estendidos. Descer até toque do queixo no solo ou cotovelos a 90°. Sem pausa no topo. Máximo de repetições sem limite de tempo.',
    fonte: 'ACSM (2022)',
  },
  flexao_modificada: {
    nome: 'Flexão de braço — modificada (joelhos)',
    descricao: 'Idem tradicional, porém com joelhos apoiados no solo. Indicado para mulheres ou quando o protocolo tradicional não é viável.',
    fonte: 'ACSM (2022)',
  },
  abdominal_1min: {
    nome: 'Abdominal em 1 minuto (ACSM)',
    descricao: 'Decúbito dorsal, joelhos flexionados a 90°, pés apoiados, mãos nas orelhas. Flexão de tronco até toque de cotovelos nos joelhos. Contar repetições em 60 segundos.',
    fonte: 'Pollock & Wilmore (1990) / ACSM (2022)',
  },
  prancha_ventral: {
    nome: 'Prancha ventral isométrica (McGill)',
    descricao: 'Posição de pranchas nos antebraços, corpo alinhado, quadril neutro. Manter posição o máximo de tempo possível. Registrar em segundos.',
    fonte: 'McGill SM (2007)',
  },
  agachamento_1min: {
    nome: 'Agachamento livre em 1 minuto',
    descricao: 'Em pé, pés na largura dos ombros, descer até coxas paralelas ao solo. Sem carga. Contar repetições em 60 segundos mantendo técnica.',
    fonte: 'Matsudo SMM (2001) / ACSM (2022)',
  },
  wall_sit: {
    nome: 'Wall sit (isometria de MMII)',
    descricao: 'Costas apoiadas na parede, joelhos a 90°, coxas paralelas ao solo, braços estendidos ao longo do corpo. Manter posição o máximo de tempo. Registrar em segundos.',
    fonte: 'Protocolo empírico / literatura geral',
  },
  sentar_levantar_30s: {
    nome: 'Teste de Sentar e Levantar em 30 segundos',
    descricao: 'Cadeira sem apoio de braços, altura de assento ~43 cm. Sentar e levantar completamente o máximo de vezes em 30 segundos, com braços cruzados sobre o peito.',
    fonte: 'Rikli & Jones, Senior Fitness Test (2013)',
  },
  arm_curl_30s: {
    nome: 'Arm Curl Test em 30 segundos',
    descricao: 'Sentado em cadeira, halter de 5 lb (♀) ou 8 lb (♂), realizar flexões de cotovelo completas em 30 segundos. Contar total de repetições.',
    fonte: 'Rikli & Jones, Senior Fitness Test (2013)',
  },
};
