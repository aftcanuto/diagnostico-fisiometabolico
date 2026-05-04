import type { Sexo } from '@/types';
import { scoreVO2 } from '../calculations/cardio';
import { classificaPreensao, assimetria, type PopulacaoRef } from '../calculations/forca';

type ScoreColor = 'bad' | 'mid' | 'good';
export const scoreColor = (s: number | null | undefined): ScoreColor =>
  s == null ? 'bad' : s <= 40 ? 'bad' : s <= 70 ? 'mid' : 'good';
export const scoreLabel = (s: number | null | undefined) =>
  s == null ? '—' : s <= 40 ? 'Crítico' : s <= 70 ? 'Atenção' : 'Ótimo';

/**
 * Score composição corporal (0–100) baseado em %G e IMC.
 *
 * Faixas ideais **estreitas** para diferenciar atletas saudáveis
 * (%G ótimo) de pessoas saudáveis porém comuns. Só atinge 100 quem
 * está realmente no ideal atlético; saudável médio fica em 80–95.
 */
export function scoreComposicaoCorporal(opts: {
  pctGordura: number | null;
  imc: number | null;
  sexo: Sexo;
}): number | null {
  const { pctGordura, imc, sexo } = opts;
  if (pctGordura == null || imc == null) return null;

  // Faixa ideal estreita %G (nível atlético-saudável)
  // Homens: 10–15 ótimo; Mulheres: 18–24 ótimo
  const idealG = sexo === 'M' ? [10, 15] : [18, 24];
  const gScore = faixaScore(pctGordura, idealG[0], idealG[1], 6, 35);

  // IMC ideal estreito 20–24 (centro da faixa saudável OMS)
  const imcScore = faixaScore(imc, 20, 24, 15, 35);

  return Math.round(gScore * 0.6 + imcScore * 0.4);
}

/** Score força — combina percentil preensão + penalidade assimetria */
export function scoreForca(opts: {
  preensaoDir: number; preensaoEsq: number;
  sexo: Sexo; idade: number;
  populacao?: PopulacaoRef;
}): number {
  const { preensaoDir, preensaoEsq, sexo, idade, populacao = 'geral' } = opts;
  const media = (preensaoDir + preensaoEsq) / 2;
  const percentil = classificaPreensao(media, sexo, idade, populacao);
  const assim = assimetria(preensaoDir, preensaoEsq);
  const penal = assim > 15 ? 20 : assim > 10 ? 10 : 0;
  return Math.max(0, Math.min(100, Math.round(percentil - penal)));
}

/** Score cardio baseado em VO2max */
export function scoreCardio(opts: {
  vo2max: number | null; sexo: Sexo; idade: number;
}): number | null {
  if (opts.vo2max == null) return null;
  return scoreVO2(opts.vo2max, opts.sexo, opts.idade);
}

/**
 * Score postural — heurística sobre desvios.
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

/** Score global — média ponderada dos módulos PRESENTES */
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
