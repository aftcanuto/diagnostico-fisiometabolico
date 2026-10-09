import type { Dobras, Circunferencias, Diametros, Sexo, Somatotipo } from '@/types';
import { jacksonPollock7Density, siriFatPercent } from '@/lib/anthropometry/formulas';

/** Idade em anos a partir de ISO date */
export function calcIdade(dataNascimento: string, ref = new Date()): number {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento) ? `${dataNascimento}T12:00:00` : dataNascimento);
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

/** IMC */
export const imc = (pesoKg: number, estaturaCm: number) =>
  +(pesoKg / Math.pow(estaturaCm / 100, 2)).toFixed(2);

/**
 * Média da dobra (ISAK): 2 medidas obrigatórias.
 * Se |m1-m2| > 5% da menor → 3ª medida obrigatória; usa mediana.
 */
export function mediaDobra(m1: number | null, m2: number | null, m3: number | null) {
  if (m1 == null || m2 == null) return { media: null, precisaTerceira: false };
  const menor = Math.min(m1, m2);
  const diffPct = (Math.abs(m1 - m2) / menor) * 100;
  if (diffPct > 5) {
    if (m3 == null) return { media: null, precisaTerceira: true };
    const arr = [m1, m2, m3].sort((a, b) => a - b);
    return { media: +arr[1].toFixed(2), precisaTerceira: true };
  }
  return { media: +((m1 + m2) / 2).toFixed(2), precisaTerceira: false };
}

/**
 * % Gordura — Jackson & Pollock 7 dobras.
 * Pontos: peitoral, axilar média, tríceps, subescapular, abdominal, supra-ilíaca, coxa.
 * Densidade corporal → Siri (1961).
 */
export function percentualGorduraJP7(dobras: Dobras, sexo: Sexo, idade: number): number | null {
  const values = [
    dobras.peitoral?.media, dobras.axilar_media?.media, dobras.triceps?.media,
    dobras.subescapular?.media, dobras.abdominal?.media,
    dobras.supra_iliaca?.media, dobras.coxa?.media,
  ];
  if (!values.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0)) return null;
  if (sexo === 'M' ? idade < 18 || idade > 61 : idade < 18 || idade > 55) return null;
  const validatedValues = values as number[];
  const density = jacksonPollock7Density({ sum7: validatedValues.reduce((sum, value) => sum + value, 0), age: idade, sex: sexo });
  const percent = density === null ? null : siriFatPercent(density);
  return percent === null ? null : +percent.toFixed(2);
}

/** Massa magra (kg) */
export const massaMagra = (pesoKg: number, pctGordura: number) =>
  +(pesoKg * (1 - pctGordura / 100)).toFixed(2);

/**
 * Massa Óssea - Von Döbeln (Rocha 1974 adaptado).
 * MO = 3.02 × (h² × df × du × 400)^0.712
 *   h  = estatura em metros
 *   df = diâmetro fêmur (m)
 *   du = diâmetro úmero (m)
 */
export function massaOsseaVonDobeln(estaturaCm: number, diametroPunhoCm?: number, diametroFemurCm?: number) {
  if (!diametroPunhoCm || !diametroFemurCm) return null;
  const h = estaturaCm / 100;
  const du = diametroPunhoCm / 100;
  const df = diametroFemurCm / 100;
  const mo = 3.02 * Math.pow(h * h * df * du * 400, 0.712);
  return +mo.toFixed(2);
}

/**
 * Somatotipo Heath-Carter (antropométrico).
 * Referência: Carter (2002). Simplificado para uso clínico.
 */
export function somatotipoHeathCarter(params: {
  estaturaCm: number;
  pesoKg: number;
  dobras: { triceps: number; subescapular: number; supra_iliaca: number; panturrilhaMedial?: number };
  diametros: { umero: number; femur: number };
  circunferencias: { bracoContraidoCm: number; panturrilhaCm: number };
}): Somatotipo | null {
  const { estaturaCm, pesoKg, dobras, diametros, circunferencias } = params;
  const { triceps, subescapular, supra_iliaca } = dobras;

  if (!triceps || !subescapular || !supra_iliaca) return null;

  // Endomorfia (ajustada pela estatura)
  const X = (triceps + subescapular + supra_iliaca) * (170.18 / estaturaCm);
  const endo = -0.7182 + 0.1451 * X - 0.00068 * X * X + 0.0000014 * X * X * X;

  // Mesomorfia
  const bracoCorr = circunferencias.bracoContraidoCm - triceps / 10;
  const pantCorr = circunferencias.panturrilhaCm - (dobras.panturrilhaMedial ?? 0) / 10;
  const meso =
    0.858 * diametros.umero +
    0.601 * diametros.femur +
    0.188 * bracoCorr +
    0.161 * pantCorr -
    estaturaCm * 0.131 +
    4.5;

  // Ectomorfia
  const hwr = estaturaCm / Math.cbrt(pesoKg);
  let ecto: number;
  if (hwr >= 40.75) ecto = 0.732 * hwr - 28.58;
  else if (hwr > 38.25) ecto = 0.463 * hwr - 17.63;
  else ecto = 0.1;

  const E = +endo.toFixed(2), M = +meso.toFixed(2), C = +ecto.toFixed(2);
  return { endomorfia: E, mesomorfia: M, ectomorfia: C, classificacao: classificarSomatotipo(E, M, C) };
}

function classificarSomatotipo(e: number, m: number, c: number): string {
  const max = Math.max(e, m, c);
  if (max === m && m - Math.max(e, c) >= 0.5) return 'Mesomorfo';
  if (max === e && e - Math.max(m, c) >= 0.5) return 'Endomorfo';
  if (max === c && c - Math.max(m, e) >= 0.5) return 'Ectomorfo';
  if (Math.abs(e - m) < 0.5 && e > c) return 'Endo-Mesomorfo';
  if (Math.abs(m - c) < 0.5 && m > e) return 'Meso-Ectomorfo';
  if (Math.abs(e - c) < 0.5 && e > m) return 'Endo-Ectomorfo';
  return 'Balanceado';
}

/** Relação Cintura-Quadril */
export const rcq = (cinturaCm?: number, quadrilCm?: number) =>
  cinturaCm && quadrilCm ? +(cinturaCm / quadrilCm).toFixed(3) : null;

/* ── FFMI — Fat-Free Mass Index ─────────────────────────────
   Índice descritivo de massa livre de gordura por estatura.
   FFMI = massa_magra_kg / (altura_m²)
   FFMI normalizado = FFMI + 6.1 * (1.8 - altura_m)
   Não estima limite genético, potencial de ganho ou uso de substâncias. */
export function calcFFMI(pesoKg: number, alturaCm: number, pctGordura: number): {
  ffmi: number; ffmiNorm: number; classificacao: string;
} | null {
  if (!pesoKg || !alturaCm || pctGordura == null) return null;
  const altM = alturaCm / 100;
  const mm = pesoKg * (1 - pctGordura / 100);
  const ffmi = +(mm / (altM * altM)).toFixed(1);
  const ffmiNorm = +(ffmi + 6.1 * (1.8 - altM)).toFixed(1);
  const classificacao = 'Índice descritivo; interpretar conforme população e método';
  return { ffmi, ffmiNorm, classificacao };
}
