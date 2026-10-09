export { CATALOG_VERSION, ENGINE_VERSION, MEASUREMENTS, METHODS, PHANTOM, REFERENCES } from './catalog';
export type { MeasurementId, Method, Reference } from './catalog';
export { anthropometrySchema, newAnthropometry } from './schema';
export type { AnthropometryInput, MeasurementInput } from './schema';
export { calculateAnthropometry } from './engine';
export type { AnthropometryResults, CalculationContext, MeasurementQuality, Result, Somatotype, Status } from './types';

import type { AnthropometryInput } from './schema';
import type { AnthropometryResults, Result } from './types';

function publishable(result: Result | undefined): result is Result & { value: number } {
  return !!result && result.selected && result.status === 'available'
    && typeof result.value === 'number' && Number.isFinite(result.value);
}

function traceable(result: Result | undefined): result is Result & { value: number } {
  return !!result && result.selected && typeof result.value === 'number' && Number.isFinite(result.value);
}

export function selectedReferences(snapshot: AnthropometryResults) {
  const ids = new Set(snapshot.results.filter(traceable).flatMap(result => result.referenceIds));
  for (const result of snapshot.phantom) if (traceable(result)) {
    for (const id of result.referenceIds) ids.add(id);
  }
  return snapshot.references.filter(reference => ids.has(reference.id));
}

export function legacyProjection(input: AnthropometryInput, snapshot: AnthropometryResults) {
  const result = (id: string) => snapshot.results.find(item => item.id === id);
  const direct = (id: string) => snapshot.measurements[id as keyof typeof snapshot.measurements]?.value ?? null;
  const oneSelected = (ids: string[]) => {
    const matches = ids.map(result).filter(publishable);
    return matches.length === 1 ? matches[0].value : null;
  };
  const somatotypeSelected = snapshot.results.some(item => item.methodId === 'heathCarter' && item.selected);
  return {
    peso: direct('mass'),
    estatura: direct('height'),
    imc: publishable(result('bmi')) ? result('bmi')!.value : null,
    percentual_gordura: publishable(result('fatPercent')) ? result('fatPercent')!.value : null,
    massa_magra: publishable(result('fatFreeMass')) ? result('fatFreeMass')!.value : null,
    massa_ossea: oneSelected(['martinBone1991', 'rocha1975']),
    dobras: Object.fromEntries(['triceps','subscapular','biceps','iliacCrest','supraspinale','abdominal','thighSkinfold','calfSkinfold']
      .map(id => [id, snapshot.measurements[id as keyof typeof snapshot.measurements]?.value ?? null])),
    circunferencias: Object.fromEntries(['armRelaxed','armFlexed','forearm','chest','waist','abdomen','hip','thighMax','thighMid','calf']
      .map(id => [id, snapshot.measurements[id as keyof typeof snapshot.measurements]?.value ?? null])),
    diametros: Object.fromEntries(['humerus','femur','wrist','bimalleolar']
      .map(id => [id, snapshot.measurements[id as keyof typeof snapshot.measurements]?.value ?? null])),
    somatotipo: somatotypeSelected ? {
      endomorfia: snapshot.somatotype.endomorphy,
      mesomorfia: snapshot.somatotype.mesomorphy,
      ectomorfia: snapshot.somatotype.ectomorphy,
      classificacao: snapshot.somatotype.classification,
    } : null,
  };
}

export type AnthropometryComparison = {
  id: string; compatible: boolean; previous: number | null; current: number | null;
  delta: number | null; reason: string;
};

export function compareAnthropometry(current: AnthropometryResults, previous: AnthropometryResults): AnthropometryComparison[] {
  return current.results.filter(item => item.selected).map(item => {
    const before = previous.results.find(candidate => candidate.id === item.id && candidate.selected);
    const compatible = !!before
      && current.engineVersion === previous.engineVersion
      && current.catalogVersion === previous.catalogVersion
      && item.methodId === before.methodId
      && item.methodVersion === before.methodVersion
      && item.unit === before.unit
      && item.status === 'available'
      && before.status === 'available'
      && typeof item.value === 'number' && Number.isFinite(item.value)
      && typeof before.value === 'number' && Number.isFinite(before.value);
    const reasons = [
      !before ? 'resultado anterior ausente ou nao selecionado' : '',
      before && item.methodId !== before.methodId ? 'metodo diferente' : '',
      before && item.methodVersion !== before.methodVersion ? 'versao do metodo diferente' : '',
      current.engineVersion !== previous.engineVersion || current.catalogVersion !== previous.catalogVersion ? 'motor ou catalogo diferente' : '',
      before && item.unit !== before.unit ? 'unidade diferente' : '',
      before && (item.status !== 'available' || before.status !== 'available') ? 'qualidade nao publicavel' : '',
    ].filter(Boolean);
    return {
      id: item.id,
      compatible,
      previous: before?.value ?? null,
      current: item.value,
      delta: compatible ? item.value! - before!.value! : null,
      reason: compatible ? '' : reasons.join('; ') || 'resultados nao comparaveis',
    };
  });
}
