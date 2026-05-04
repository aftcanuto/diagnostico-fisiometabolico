/** Força relativa (kgf/kg) */
export const forcaRelativa = (kgf: number, pesoKg: number) =>
  pesoKg > 0 ? +(kgf / pesoKg).toFixed(3) : 0;

/**
 * Assimetria (%) entre dominante e não dominante.
 * Acima de 10-15% é considerado clinicamente relevante.
 */
export function assimetria(dir: number, esq: number): number {
  const max = Math.max(dir, esq);
  const min = Math.min(dir, esq);
  if (max === 0) return 0;
  return +(((max - min) / max) * 100).toFixed(2);
}

export type PopulacaoRef = 'geral' | 'ativa' | 'atleta';

/**
 * Tabelas de referência (mediana kgf + desvio-padrão).
 * - geral:  Schlüssel et al. (2008) — adultos brasileiros sedentários/ativos leves
 * - ativa:  deslocamento ~-10% aplicado sobre a mediana geral — praticantes regulares
 *           (norma mais exigente: quem já treina precisa estar acima da mediana treinada)
 * - atleta: deslocamento ~+17% aplicado sobre a geral — competidores
 */
const TABELAS: Record<PopulacaoRef, Record<string, { m: number; dp: number }>> = {
  geral: {
    'M_20': { m: 47, dp: 8 },  'F_20': { m: 30, dp: 6 },
    'M_30': { m: 46, dp: 8 },  'F_30': { m: 29, dp: 6 },
    'M_40': { m: 44, dp: 8 },  'F_40': { m: 28, dp: 6 },
    'M_50': { m: 41, dp: 8 },  'F_50': { m: 26, dp: 6 },
    'M_60': { m: 36, dp: 7 },  'F_60': { m: 23, dp: 5 },
    'M_70': { m: 30, dp: 7 },  'F_70': { m: 19, dp: 5 },
  },
  ativa: {
    'M_20': { m: 42, dp: 7 },  'F_20': { m: 27, dp: 5 },
    'M_30': { m: 41, dp: 7 },  'F_30': { m: 26, dp: 5 },
    'M_40': { m: 39, dp: 7 },  'F_40': { m: 25, dp: 5 },
    'M_50': { m: 36, dp: 7 },  'F_50': { m: 23, dp: 5 },
    'M_60': { m: 32, dp: 6 },  'F_60': { m: 20, dp: 4 },
    'M_70': { m: 27, dp: 6 },  'F_70': { m: 17, dp: 4 },
  },
  atleta: {
    'M_20': { m: 55, dp: 9 },  'F_20': { m: 36, dp: 7 },
    'M_30': { m: 54, dp: 9 },  'F_30': { m: 35, dp: 7 },
    'M_40': { m: 52, dp: 9 },  'F_40': { m: 33, dp: 7 },
    'M_50': { m: 49, dp: 9 },  'F_50': { m: 31, dp: 7 },
    'M_60': { m: 44, dp: 8 },  'F_60': { m: 28, dp: 6 },
    'M_70': { m: 38, dp: 8 },  'F_70': { m: 24, dp: 6 },
  },
};

/**
 * Classificação preensão palmar por faixa etária / sexo / população.
 * Retorna percentil estimado (0-100) com base na distribuição normal.
 *
 * @param populacao 'geral' (default) para população adulta típica;
 *                  'ativa' para praticantes regulares de exercício;
 *                  'atleta' para atletas competitivos (referência mais exigente).
 */
export function classificaPreensao(
  kgfMedia: number,
  sexo: 'M' | 'F',
  idade: number,
  populacao: PopulacaoRef = 'geral'
): number {
  const ref = TABELAS[populacao];
  const faixa = Math.max(20, Math.min(70, Math.floor(idade / 10) * 10));
  const r = ref[`${sexo}_${faixa}`];
  if (!r) return 50;
  const z = (kgfMedia - r.m) / r.dp;
  const pct = 50 + 50 * erf(z / Math.SQRT2);
  return Math.round(Math.max(0, Math.min(100, pct)));
}

// aproximação de função erro
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}
