import assert from 'node:assert/strict';
import {
  CORRECTED_GIRTH_RESULT_IDS, MEASUREMENTS, calculateAnthropometry, compareAnthropometry, legacyProjection,
  newAnthropometry, selectedReferences,
} from '../src/lib/anthropometry';
import { hasLegacyAnthropometryData } from '../src/lib/anthropometry-record';
import {
  correctedGirth, durninWomersleyDensity, ectomorphy, jacksonDensity,
  jacksonPollock7Density, kerrComponent, leeMuscle, martinBone, martinMuscle,
  mirwaldOffset, phantomZ, rochaBone, siriFatPercent, somatotypeGirth,
} from '../src/lib/anthropometry/formulas';

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
input.methods = ['direct','indices','martin1990','lee2000','kerrMuscle1988','kerrAdipose1988','martinBone1991','rocha1975','heathCarter','phantom','durninWomersley1974','siri1961'];
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
assert.ok((result.results.find(item => item.id === 'durninWomersleyDensity')?.value ?? 0) > 1);
assert.ok((result.results.find(item => item.id === 'fatPercent')?.value ?? 0) > 0);
assert.equal(result.results.find(item => item.id === 'fatPercent')?.status, 'available');
const waistHeightRatio = result.results.find(item => item.id === 'waistHeightRatio');
assert.equal(waistHeightRatio?.label, 'Relacao cintura minima/estatura');
assert.ok(Math.abs(waistHeightRatio!.value! - result.measurements.waist.value! / result.measurements.height.value!) < 1e-12);
assert.equal(waistHeightRatio?.status, 'available');
assert.match(String(waistHeightRatio?.inputs.measurementSite), /cintura minima ISAK/i);
assert.equal(result.results.some(item => item.id === 'waistClassification'), false, 'Nao deve publicar classificacao OMS com cintura minima ISAK');
assert.ok((result.results.find(item => item.id === 'martin1990')?.value ?? 0) > 0);
assert.ok((result.results.find(item => item.id === 'martinBone1991')?.value ?? 0) > 0);
assert.equal(result.results.find(item => item.id === 'martinBone1991')?.status, 'review');
assert.ok(selectedReferences(result).some(reference => reference.id === 'MARTIN_OSSEO_1991'));
assert.deepEqual([...CORRECTED_GIRTH_RESULT_IDS], [
  'armRelaxedCorrected', 'chestCorrected', 'thighMaxCorrected',
  'thighMidCorrected', 'calfCorrected', 'correctedGirthSum5',
]);
for (const id of CORRECTED_GIRTH_RESULT_IDS) {
  assert.ok(result.results.some(item => item.id === id && item.value !== null), `${id} deve estar disponivel na coleta completa`);
}
assert.ok(Math.abs(result.results.find(item => item.id === 'armRelaxedCorrected')!.value! - correctedGirth(result.measurements.armRelaxed.value!, result.measurements.triceps.value!)) < 1e-12);
assert.ok(Math.abs(result.results.find(item => item.id === 'chestCorrected')!.value! - correctedGirth(result.measurements.chest.value!, result.measurements.subscapular.value!)) < 1e-12);
assert.ok(Math.abs(result.results.find(item => item.id === 'thighMaxCorrected')!.value! - correctedGirth(result.measurements.thighMax.value!, result.measurements.thighSkinfold.value!)) < 1e-12);
assert.ok(Math.abs(result.results.find(item => item.id === 'thighMidCorrected')!.value! - correctedGirth(result.measurements.thighMid.value!, result.measurements.thighSkinfold.value!)) < 1e-12);
assert.ok(Math.abs(result.results.find(item => item.id === 'calfCorrected')!.value! - correctedGirth(result.measurements.calf.value!, result.measurements.calfSkinfold.value!)) < 1e-12);

const partial = newAnthropometry();
partial.measurements.mass.readings = [76, null, null];
partial.measurements.height.readings = [178, null, null];
partial.measurements.abdomen.notApplicable = true;
partial.measurements.abdomen.notApplicableReason = 'Sem relevancia para o objetivo desta avaliacao';
partial.methods = ['direct','indices'];
const partialResult = calculateAnthropometry(partial, context);
assert.equal(partialResult.measurements.abdomen.value, null);
assert.equal(partialResult.measurements.abdomen.status, 'missing');
assert.match(partialResult.measurements.abdomen.reason, /nao aplicavel/i);
assert.ok((partialResult.results.find(item => item.id === 'bmi')?.value ?? 0) > 0, 'IMC deve continuar calculado sem perimetro abdominal');

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
assert.ok((projection.percentual_gordura ?? 0) > 0);
assert.ok((projection.massa_magra ?? 0) > 0);
assert.equal(projection.diametros.bimalleolar, result.measurements.bimalleolar.value);
assert.equal('rcq' in projection, false);
assert.equal('observacoes' in projection, false);
assert.equal(projection.massa_ossea, null, 'dois metodos osseos selecionados nao podem virar um unico valor legado');
const singleBoneInput = structuredClone(input);
singleBoneInput.methods = singleBoneInput.methods.filter(method => method !== 'rocha1975');
const singleBoneProjection = legacyProjection(singleBoneInput, calculateAnthropometry(singleBoneInput, context));
assert.ok((singleBoneProjection.massa_ossea ?? 0) > 0, 'resultado numerico em revisao deve permanecer utilizavel com ressalva');

const singleReadingInput = structuredClone(input);
for (const measurement of MEASUREMENTS) {
  singleReadingInput.measurements[measurement.id].readings = [values[measurement.id], null, null];
}
const singleReadingResult = calculateAnthropometry(singleReadingInput, context);
assert.equal(singleReadingResult.results.find(item => item.id === 'fatPercent')?.status, 'review');
assert.ok((legacyProjection(singleReadingInput, singleReadingResult).percentual_gordura ?? 0) > 0,
  'percentual calculado com uma leitura deve alimentar relatorio e IA com ressalva');

const withoutAbdomen = structuredClone(input);
withoutAbdomen.measurements.abdominal = { ...withoutAbdomen.measurements.abdominal, readings:[null,null,null], notApplicable:true, notApplicableReason:'Nao coletada' };
withoutAbdomen.measurements.abdomen = { ...withoutAbdomen.measurements.abdomen, readings:[null,null,null], notApplicable:true, notApplicableReason:'Nao coletado' };
const withoutAbdomenResult = calculateAnthropometry(withoutAbdomen, context);
assert.ok((withoutAbdomenResult.results.find(item => item.id === 'fatPercent')?.value ?? 0) > 0, 'Durnin-Womersley nao depende de dobra nem perimetro abdominal');
assert.equal(withoutAbdomenResult.results.find(item => item.id === 'fatPercent')?.status, 'available');
assert.equal(withoutAbdomenResult.results.find(item => item.id === 'kerrAdipose1988')?.value, null, 'Kerr continua indisponivel sem dobra abdominal');
assert.ok((legacyProjection(withoutAbdomen, withoutAbdomenResult).percentual_gordura ?? 0) > 0);

const juvenileResult = calculateAnthropometry(input, { date:'2026-09-28', birthDate:'2010-03-01', sex:'F' });
assert.match(juvenileResult.results.find(item => item.id === 'durninWomersleyDensity')?.label ?? '', /Durnin-Rahaman/);
assert.ok(juvenileResult.results.find(item => item.id === 'fatPercent')?.referenceIds.includes('DURNIN_RAHAMAN_1967'));

const withoutAbdominalGirth = structuredClone(input);
withoutAbdominalGirth.measurements.abdomen = { ...withoutAbdominalGirth.measurements.abdomen, readings:[null,null,null], notApplicable:true, notApplicableReason:'Nao coletado' };
const withoutAbdominalGirthResult = calculateAnthropometry(withoutAbdominalGirth, context);
assert.equal(withoutAbdominalGirthResult.results.find(item => item.id === 'fatPercent')?.value, result.results.find(item => item.id === 'fatPercent')?.value, 'perimetro abdominal nao participa do percentual de gordura');
assert.equal(withoutAbdominalGirthResult.results.find(item => item.id === 'kerrAdipose1988')?.value, result.results.find(item => item.id === 'kerrAdipose1988')?.value, 'perimetro abdominal nao participa da massa adiposa de Kerr');

const thickerAbdominalSkinfold = structuredClone(input);
thickerAbdominalSkinfold.measurements.abdominal.readings = [30,30,null];
const thickerAbdominalSkinfoldResult = calculateAnthropometry(thickerAbdominalSkinfold, context);
assert.equal(thickerAbdominalSkinfoldResult.results.find(item => item.id === 'fatPercent')?.value, result.results.find(item => item.id === 'fatPercent')?.value, 'Durnin-Womersley nao usa a dobra abdominal');
assert.notEqual(thickerAbdominalSkinfoldResult.results.find(item => item.id === 'kerrAdipose1988')?.value, result.results.find(item => item.id === 'kerrAdipose1988')?.value, 'Kerr deve usar a dobra abdominal');

const kerrScale = 170.18/178;
const kerrZ = (220*kerrScale-207.21)/13.74;
assert.ok(Math.abs(kerrComponent({height:178,sum:220,component:'muscle'})-(24.5+4.4*kerrZ)/kerrScale**3) < 1e-12, 'Kerr muscular deve usar coeficiente 4.4');

assert.ok(Math.abs(correctedGirth(31,12)-(31-Math.PI*1.2)) < 1e-12);
assert.equal(somatotypeGirth(31,12), 29.8);
assert.ok(Math.abs(martinMuscle({height:178,thigh:48,forearm:27,calf:34})-39.8526238) < 1e-7);
assert.ok(Math.abs(leeMuscle({height:178,arm:28,thigh:48,calf:34,age:35,sex:'M',category:0})-31.5860232) < 1e-7);
assert.ok(Math.abs(martinBone({height:178,humerus:7,femur:9.8,wrist:5.8,bimalleolar:7.2})-9.4842672) < 1e-7);
assert.ok(Math.abs(rochaBone({height:178,wrist:5.8,femur:9.8})-12.319283152619038) < 1e-12);
assert.equal(ectomorphy(38), .1);
assert.ok(Math.abs(ectomorphy(39)-(.463*39-17.63)) < 1e-12);
assert.ok(Math.abs(ectomorphy(41)-(.732*41-28.58)) < 1e-12);
assert.equal(phantomZ({value:15.4,height:170.18,mean:15.4,sd:4.47,dimension:1}), 0);
assert.ok(Math.abs(mirwaldOffset({height:170,sittingHeight:90,mass:60,age:14,sex:'M'})-.7523011764705885) < 1e-12);
assert.ok(Math.abs(jacksonDensity({sum3:60,age:35})-1.0433261) < 1e-12);
assert.ok(Math.abs(jacksonPollock7Density({sum7:112,age:35,sex:'M'})!-1.06009122) < 1e-12);
assert.ok(Math.abs(jacksonPollock7Density({sum7:112,age:35,sex:'F'})!-1.04692732) < 1e-12);
assert.equal(jacksonPollock7Density({sum7:0,age:35,sex:'M'}), null);
assert.ok(Math.abs(durninWomersleyDensity({sum4:47,age:35,sex:'M'})!-1.051237876528297) < 1e-12);
assert.ok(Math.abs(durninWomersleyDensity({sum4:47,age:16,sex:'F'})!-1.036908548095444) < 1e-12);
assert.ok(Math.abs(siriFatPercent(1.05)!-(495/1.05-450)) < 1e-12);

const frozen = result.results[0].value;
assert.throws(() => { (result.results[0] as any).value = 999; });
assert.equal(result.results[0].value, frozen);
console.log('Antropometria V2: 26 medidas, qualidade, bimaleolar, metodos, referencias, strict26, comparacao e projecao aprovados.');
