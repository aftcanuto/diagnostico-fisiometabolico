export type FriendModality = 'treadmill' | 'cycle';

export interface FriendInput {
  measuredVo2?: number | null;
  age: number;
  sex: 'M' | 'F';
  weightKg: number;
  heightCm: number;
  modality: FriendModality;
}

export interface FriendComparison {
  reference: 'FRIEND-2018';
  modality: FriendModality;
  predictedVo2: number;
  measuredVo2: number | null;
  percentPredicted: number | null;
  difference: number | null;
  standardError: 6.6;
  approximateBand: { min: number; max: number };
  interpretation: 'below_estimate' | 'within_estimate' | 'above_estimate' | null;
  weightKg: number;
  heightCm: number;
  note: string;
}

function finitePositive(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeFriendModality(protocol: unknown): FriendModality | null {
  const value = String(protocol ?? '').trim().toLowerCase();
  if (/esteira|treadmill/.test(value)) return 'treadmill';
  if (/bike|bicic|ciclo|cycle|ergometr/.test(value)) return 'cycle';
  return null;
}

export function calculateFriendComparison(input: FriendInput): FriendComparison | null {
  const age = finitePositive(input.age);
  const weightKg = finitePositive(input.weightKg);
  const heightCm = finitePositive(input.heightCm);
  if (age == null || age < 20 || age > 85 || weightKg == null || heightCm == null) return null;

  const weightLb = weightKg * 2.2046226218;
  const heightIn = heightCm / 2.54;
  const sexCode = input.sex === 'M' ? 1 : 2;
  const modeCode = input.modality === 'treadmill' ? 1 : 2;
  const predicted = 45.2 - (0.35 * age) - (10.9 * sexCode) - (0.15 * weightLb)
    + (0.68 * heightIn) - (0.46 * modeCode);
  if (!Number.isFinite(predicted) || predicted <= 0) return null;

  const predictedVo2 = +predicted.toFixed(1);
  const measured = finitePositive(input.measuredVo2);
  const measuredVo2 = measured == null ? null : +measured.toFixed(1);
  const percentPredicted = measured == null ? null : +((measured / predicted) * 100).toFixed(1);
  const difference = measured == null ? null : +(measured - predicted).toFixed(1);
  const approximateBand = {
    min: +Math.max(0, predicted - 6.6).toFixed(1),
    max: +(predicted + 6.6).toFixed(1),
  };
  const interpretation = measured == null ? null
    : measured < predicted - 6.6 ? 'below_estimate'
      : measured > predicted + 6.6 ? 'above_estimate'
        : 'within_estimate';

  return {
    reference: 'FRIEND-2018', modality: input.modality, predictedVo2, measuredVo2,
    percentPredicted, difference, standardError: 6.6, approximateBand, interpretation,
    weightKg: +weightKg.toFixed(1), heightCm: +heightCm.toFixed(1),
    note: 'Comparacao pela equacao FRIEND 2018. Percentual do previsto nao e percentil populacional.',
  };
}

function anthropometryValue(row: any, legacyKey: 'peso' | 'estatura', measurementId: 'mass' | 'height') {
  return finitePositive(row?.[legacyKey])
    ?? finitePositive(row?.resultados_v2?.measurements?.[measurementId]?.value)
    ?? finitePositive(row?.registro_v2?.measurements?.[measurementId]?.value);
}

export function friendComparisonFromAssessment(input: {
  cardio?: any;
  anthropometry?: any;
  bioimpedance?: any;
  age: number;
  sex: 'M' | 'F';
}): FriendComparison | null {
  const modality = normalizeFriendModality(input.cardio?.protocolo);
  if (!modality) return null;
  const weightKg = anthropometryValue(input.anthropometry, 'peso', 'mass')
    ?? finitePositive(input.bioimpedance?.peso_kg)
    ?? finitePositive(input.bioimpedance?.peso);
  const heightCm = anthropometryValue(input.anthropometry, 'estatura', 'height')
    ?? finitePositive(input.bioimpedance?.altura_cm)
    ?? finitePositive(input.bioimpedance?.estatura);
  if (weightKg == null || heightCm == null) return null;
  return calculateFriendComparison({
    measuredVo2: input.cardio?.vo2max,
    age: input.age,
    sex: input.sex,
    weightKg,
    heightCm,
    modality,
  });
}

export function friendInterpretationLabel(value: FriendComparison['interpretation']) {
  if (value === 'below_estimate') return 'Abaixo da faixa aproximada da estimativa';
  if (value === 'above_estimate') return 'Acima da faixa aproximada da estimativa';
  if (value === 'within_estimate') return 'Compativel com a faixa aproximada da estimativa';
  return null;
}
