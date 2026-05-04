import type { ZonasTreino } from '@/types';

/** FCmáx prevista — Tanaka (208 − 0.7 × idade) */
export const fcMaxTanaka = (idade: number) => Math.round(208 - 0.7 * idade);

/**
 * Zonas de treinamento Z1-Z5 por % FCmáx.
 * Z1 50-60 | Z2 60-70 | Z3 70-80 | Z4 80-90 | Z5 90-100
 */
export function zonasTreinamento(fcMax: number): ZonasTreino {
  const z = (minPct: number, maxPct: number) => ({
    min: Math.round(fcMax * minPct),
    max: Math.round(fcMax * maxPct)
  });
  return {
    z1: z(0.50, 0.60),
    z2: z(0.60, 0.70),
    z3: z(0.70, 0.80),
    z4: z(0.80, 0.90),
    z5: z(0.90, 1.00),
  };
}

/** Classifica VO2max (ml/kg/min) - Cooper/ACSM adult */
export function classificaVO2(vo2: number, sexo: 'M' | 'F', idade: number): string {
  const ref = sexo === 'M'
    ? { 20: [35, 43, 50], 30: [33, 41, 48], 40: [31, 38, 45], 50: [28, 35, 42], 60: [25, 32, 39] }
    : { 20: [30, 36, 42], 30: [28, 34, 40], 40: [26, 32, 38], 50: [23, 29, 35], 60: [20, 26, 32] };
  const faixa = Math.max(20, Math.min(60, Math.floor(idade / 10) * 10)) as keyof typeof ref;
  const [ruim, bom, otimo] = ref[faixa];
  if (vo2 < ruim) return 'Baixo';
  if (vo2 < bom) return 'Regular';
  if (vo2 < otimo) return 'Bom';
  return 'Excelente';
}

/** Score VO2 normalizado 0-100 (relativo a faixa etária/sexo) */
export function scoreVO2(vo2: number, sexo: 'M' | 'F', idade: number): number {
  const ref = sexo === 'M'
    ? { min: 25, max: 55 }
    : { min: 20, max: 48 };
  // ajuste por idade (perda ~0.3 ml/kg/min/ano a partir de 25)
  const ajuste = Math.max(0, (idade - 25) * 0.3);
  const min = ref.min - ajuste;
  const max = ref.max - ajuste;
  const s = ((vo2 - min) / (max - min)) * 100;
  return Math.round(Math.max(0, Math.min(100, s)));
}
