import type { Sexo } from '@/types';
import { scoreVO2 } from '../calculations/cardio';
import { assimetria, type PopulacaoRef } from '../calculations/forca';

type ScoreColor = 'bad' | 'mid' | 'good';
export const scoreColor = (s: number | null | undefined): ScoreColor =>
  s == null ? 'bad' : s <= 40 ? 'bad' : s <= 70 ? 'mid' : 'good';
export const scoreLabel = (s: number | null | undefined) =>
  s == null ? '—' : s <= 40 ? 'Crítico' : s <= 70 ? 'Atenção' : 'Ótimo';

/**
 * Score composicao corporal (0-100) baseado em %G e IMC.
 *
 * Faixas ideais estreitas para diferenciar atletas saudaveis
 * (%G otimo) de pessoas saudaveis porem comuns. So atinge 100 quem
 * esta realmente no ideal atletico; saudavel medio fica em 80-95.
 */
export function scoreComposicaoCorporal(opts: {
  pctGordura: number | null;
  imc: number | null;
  sexo: Sexo;
}): number | null {
  const { pctGordura, imc, sexo } = opts;
  if (pctGordura == null || imc == null) return null;

  // Faixa ideal estreita %G (nivel atletico-saudavel)
  // Homens: 10-15 otimo; Mulheres: 18-24 otimo
  const idealG = sexo === 'M' ? [10, 15] : [18, 24];
  const gScore = faixaScore(pctGordura, idealG[0], idealG[1], 6, 35);

  // IMC ideal estreito 20-24 (centro da faixa saudavel OMS)
  const imcScore = faixaScore(imc, 20, 24, 15, 35);

  return Math.round(gScore * 0.6 + imcScore * 0.4);
}

type SexoNormalizado = 'M' | 'F';

function normalizaSexo(sexo: Sexo | string | null | undefined): SexoNormalizado {
  const s = String(sexo ?? '').trim().toLowerCase();
  if (s === 'f' || s.startsWith('fem')) return 'F';
  return 'M';
}

function referenciaPreensao(sexo: Sexo | string | null | undefined, idade: number) {
  const s = normalizaSexo(sexo);
  const faixa = idade >= 70 ? 70 : idade >= 60 ? 60 : idade >= 50 ? 50 : idade >= 40 ? 40 : idade >= 30 ? 30 : 20;
  const refs: Record<SexoNormalizado, Record<number, { fraco: number; adequado: number; forte: number }>> = {
    M: {
      20: { fraco: 30, adequado: 40, forte: 52 },
      30: { fraco: 29, adequado: 39, forte: 50 },
      40: { fraco: 27, adequado: 37, forte: 48 },
      50: { fraco: 25, adequado: 35, forte: 45 },
      60: { fraco: 22, adequado: 31, forte: 40 },
      70: { fraco: 18, adequado: 27, forte: 35 },
    },
    F: {
      20: { fraco: 18, adequado: 26, forte: 34 },
      30: { fraco: 17, adequado: 25, forte: 33 },
      40: { fraco: 16, adequado: 23, forte: 31 },
      50: { fraco: 14, adequado: 21, forte: 28 },
      60: { fraco: 12, adequado: 18, forte: 25 },
      70: { fraco: 10, adequado: 16, forte: 22 },
    },
  };
  return refs[s][faixa];
}

function interpola(valor: number, a: number, b: number, scoreA: number, scoreB: number) {
  if (b === a) return scoreB;
  const t = Math.max(0, Math.min(1, (valor - a) / (b - a)));
  return scoreA + (scoreB - scoreA) * t;
}

function scorePreensaoClinico(mediaKgf: number, sexo: Sexo | string | null | undefined, idade: number) {
  const ref = referenciaPreensao(sexo, idade);
  if (mediaKgf <= 0) return 0;
  if (mediaKgf < ref.fraco) return interpola(mediaKgf, Math.max(1, ref.fraco * 0.55), ref.fraco, 20, 45);
  if (mediaKgf < ref.adequado) return interpola(mediaKgf, ref.fraco, ref.adequado, 45, 72);
  if (mediaKgf < ref.forte) return interpola(mediaKgf, ref.adequado, ref.forte, 72, 92);
  return Math.min(100, interpola(mediaKgf, ref.forte, ref.forte * 1.2, 92, 100));
}

/** Score forca: preensao palmar por sexo/idade + penalidade por assimetria. */
export function scoreForca(opts: {
  preensaoDir: number; preensaoEsq: number;
  sexo: Sexo; idade: number;
  populacao?: PopulacaoRef;
}): number {
  const { preensaoDir, preensaoEsq, sexo, idade } = opts;
  const media = (preensaoDir + preensaoEsq) / 2;
  const scoreBase = scorePreensaoClinico(media, sexo, idade);
  const assim = assimetria(preensaoDir, preensaoEsq);
  const penal = assim > 20 ? 18 : assim > 15 ? 12 : assim > 10 ? 6 : 0;
  return Math.max(10, Math.min(100, Math.round(scoreBase - penal)));
}

export function scoreForcaPorPreensao(opts: {
  preensaoDir?: number | string | null;
  preensaoEsq?: number | string | null;
  sexo: Sexo;
  idade: number;
  populacao?: PopulacaoRef;
}): number | null {
  const dir = Number(opts.preensaoDir);
  const esq = Number(opts.preensaoEsq);
  const hasDir = Number.isFinite(dir) && dir > 0;
  const hasEsq = Number.isFinite(esq) && esq > 0;
  if (!hasDir && !hasEsq) return null;

  return scoreForca({
    preensaoDir: hasDir ? dir : esq,
    preensaoEsq: hasEsq ? esq : dir,
    sexo: opts.sexo,
    idade: opts.idade,
    populacao: opts.populacao ?? 'geral',
  });
}

/** Score cardio baseado em VO2max */
export function scoreCardio(opts: {
  vo2max: number | null; sexo: Sexo; idade: number;
}): number | null {
  if (opts.vo2max == null) return null;
  return scoreVO2(opts.vo2max, opts.sexo, opts.idade);
}

/**
 * Score postural: heuristica sobre desvios.
 * Cada desvio marcado como `true` no jsonb subtrai pontos.
 */
export function scorePostura(alinhamentos: Record<string, boolean> | null | undefined): number | null {
  if (!alinhamentos) return null;
  const pesos: Record<string, number> = {
    cabeca_anteriorizada: 10,
    ombros_protrusos: 8,
    hipercifose_toracica: 10,
    hiperlordose_lombar: 10,
    retificacao_lombar: 6,
    escoliose: 15,
    joelhos_valgo: 8,
    joelhos_varo: 8,
    joelhos_recurvato: 6,
    pe_plano: 6,
    pe_cavo: 6,
    assimetria_ombros: 8,
    assimetria_pelvica: 10,
  };
  let desconto = 0;
  for (const [k, v] of Object.entries(alinhamentos)) {
    if (v && pesos[k]) desconto += pesos[k];
  }
  return Math.max(0, 100 - desconto);
}

/** Score global: media ponderada dos modulos presentes */
export function scoreGlobal(scores: {
  postura: number | null;
  composicao_corporal: number | null;
  forca: number | null;
  flexibilidade?: number | null;
  cardiorrespiratorio: number | null;
}): number | null {
  const pesos: Record<string, number> = {
    postura: 0.15,
    composicao_corporal: 0.25,
    forca: 0.20,
    flexibilidade: 0.10,
    cardiorrespiratorio: 0.30,
  };
  let total = 0, pesoTotal = 0;
  for (const k of Object.keys(pesos)) {
    const v = (scores as any)[k];
    if (v != null) { total += v * pesos[k]; pesoTotal += pesos[k]; }
  }
  if (pesoTotal === 0) return null;
  return Math.round(total / pesoTotal);
}

// helper: transforma valor em score 0-100 dado faixa ideal + extremos
function faixaScore(v: number, idealMin: number, idealMax: number, absMin: number, absMax: number) {
  if (v >= idealMin && v <= idealMax) return 100;
  if (v < idealMin) {
    if (v <= absMin) return 0;
    return ((v - absMin) / (idealMin - absMin)) * 100;
  }
  if (v >= absMax) return 0;
  return ((absMax - v) / (absMax - idealMax)) * 100;
}
