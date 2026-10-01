import assert from 'node:assert/strict';
import {
  MEASUREMENTS, calculateAnthropometry, compareAnthropometry, legacyProjection,
  newAnthropometry, selectedReferences,
} from '../src/lib/anthropometry';
import { hasLegacyAnthropometryData } from '../src/lib/anthropometry-record';

assert.equal(hasLegacyAnthropometryData(null), false);
assert.equal(hasLegacyAnthropometryData({ dobras: { triceps: { m1: null, m2: null, m3: null, media: null } }, circunferencias: {}, diametros: {} }), false);
assert.equal(hasLegacyAnthropometryData({ dobras: { triceps: { m1: 0 } } }), true);
assert.equal(hasLegacyAnthropometryData({ peso: 80 }), true);
assert.equal(hasLegacyAnthropometryData({ registro_v2: { version: 2 }, peso: 80 }), false);

const input = newAnthropometry();
const values: Record<string, number> = {
  mass: 76, height: 178, sittingHeight: 92, armSpan: 181,
  triceps: 12, subscapular: 14, biceps: 6, iliacCrest: 15,
  supraspinale: 11, abdominal: 18, thighSkinfold: 16, calfSkinfold: 10,
  armRelaxed: 31, armFlexed: 34, forearm: 27, chest: 98, waist: 81,
  abdomen: 84, hip: 97, thighMax: 57, thighMid: 53, calf: 37,
  humerus: 7, femur: 9.8, wrist: 5.8, bimalleolar: 7.2,
};
for (const measurement of MEASUREMENTS) {
  const value = values[measurement.id];
  assert.equal(typeof value, 'number', `fixture ausente: ${measurement.id}`);
  input.measurements[measurement.id].readings = [value, value * 1.002, null];
}
input.methods = ['direct','indices','martin1990','lee2000','kerrMuscle1988','kerrAdipose1988','martinBone1991','rocha1975','heathCarter','phantom'];
input.populationCategory = 'whiteHispanic';
input.pregnant = false;
input.targets.muscleMethod = 'martin1990';
input.targets.boneMethod = 'martinBone1991';
input.manualEdition = 'Edicao informada no teste';
const context = { date: '2026-09-28', birthDate: '1990-01-01', sex: 'M' as const };
const result = calculateAnthropometry(input, context);

assert.equal(Object.keys(result.measurements).length, 26);
assert.equal(result.measurements.bimalleolar.label, 'Diametro bimaleolar');
assert.equal(result.measurements.mass.consolidation, 'mean');
assert.ok(Math.abs(result.measurements.mass.value! - 76.076) < 1e-10);
assert.equal(result.results.find(item => item.id === 'petroskiDensity')?.status, 'missing');
assert.equal(result.results.find(item => item.id === 'fatPercent')?.value, null);
assert.match(result.results.find(item => item.id === 'fatPercent')?.reason ?? '', /landmarks compativeis/i);
assert.ok((result.results.find(item => item.id === 'martin1990')?.value ?? 0) > 0);
assert.ok((result.results.find(item => item.id === 'martinBone1991')?.value ?? 0) > 0);
assert.equal(result.results.find(item => item.id === 'martinBone1991')?.status, 'review');
assert.ok(selectedReferences(result).some(reference => reference.id === 'MARTIN_OSSEO_1991'));

const third = structuredClone(input);
third.measurements.triceps.readings = [10, 12, null];
let revised = calculateAnthropometry(third, context);
assert.equal(revised.measurements.triceps.requiresThird, true);
assert.equal(revised.measurements.triceps.status, 'review');
third.measurements.triceps.readings = [10, 12, 11];
revised = calculateAnthropometry(third, context);
assert.equal(revised.measurements.triceps.consolidation, 'median');
assert.equal(revised.measurements.triceps.value, 11);

const widerAnkle = structuredClone(input);
widerAnkle.measurements.bimalleolar.readings = [8.2, 8.2, null];
const resultWider = calculateAnthropometry(widerAnkle, context);
assert.ok(resultWider.results.find(item => item.id === 'martinBone1991')!.value! > result.results.find(item => item.id === 'martinBone1991')!.value!);
const comparison = compareAnthropometry(resultWider, result).find(item => item.id === 'martinBone1991');
assert.equal(comparison?.compatible, false, 'resultado em revisao nao deve gerar delta automatico');

const projection = legacyProjection(input, result);
assert.equal(projection.percentual_gordura, null);
assert.equal(projection.massa_magra, null);
assert.equal(projection.diametros.bimalleolar, result.measurements.bimalleolar.value);
assert.equal(projection.massa_ossea, null, 'dois metodos osseos selecionados nao podem virar um unico valor legado');
const singleBoneInput = structuredClone(input);
singleBoneInput.methods = singleBoneInput.methods.filter(method => method !== 'rocha1975');
const singleBoneProjection = legacyProjection(singleBoneInput, calculateAnthropometry(singleBoneInput, context));
assert.equal(singleBoneProjection.massa_ossea, null, 'resultado em revisao permanece no snapshot V2 e nao vaza como valor legado confirmado');

const frozen = result.results[0].value;
assert.throws(() => { (result.results[0] as any).value = 999; });
assert.equal(result.results[0].value, frozen);
console.log('Antropometria V2: 26 medidas, qualidade, bimaleolar, metodos, referencias, strict26, comparacao e projecao aprovados.');
