import assert from 'node:assert/strict';

import { calcFFMI, imc, massaMagra, mediaDobra, percentualGorduraJP7, rcq } from '../src/lib/calculations/antropometria';
import { classificaVO2, scoreVO2, zonasTreinamento } from '../src/lib/calculations/cardio';
import { calculateFriendComparison, friendComparisonFromAssessment, normalizeFriendModality } from '../src/lib/calculations/friend';
import { classificarWells, scoreFlexibilidade } from '../src/lib/calculations/flexibilidade';
import { assimetria, forcaRelativa } from '../src/lib/calculations/forca';
import { calcularRML } from '../src/lib/calculations/rml';
import { scoreComposicaoCorporal } from '../src/lib/scores';
import { classificarComposicaoCorporal, composicaoOficialParaIA, percentualGorduraAntropometria } from '../src/lib/bodyComposition';

assert.equal(imc(76, 170), 26.3);
assert.deepEqual(mediaDobra(10, 10.4, null), { media: 10.2, precisaTerceira: false });
assert.deepEqual(mediaDobra(10, 12, null), { media: null, precisaTerceira: true });
assert.equal(massaMagra(76, 14.32), 65.12);
assert.equal(rcq(72, 92), 0.783);

const seteDobras = {
  peitoral: { media: 10 }, axilar_media: { media: 12 }, triceps: { media: 14 },
  subescapular: { media: 16 }, abdominal: { media: 18 }, supra_iliaca: { media: 20 },
  coxa: { media: 22 },
} as any;
assert.equal(percentualGorduraJP7(seteDobras, 'M', 35), 16.94);
assert.equal(percentualGorduraJP7(seteDobras, 'F', 35), 22.81);
assert.equal(percentualGorduraJP7({ ...seteDobras, abdominal: { media: null } }, 'M', 35), null);
assert.equal(percentualGorduraJP7(seteDobras, 'M', 17), null);

const ffmi = calcFFMI(76, 170, 14.32);
assert.ok(ffmi);
assert.equal(ffmi?.ffmi, 22.5);
assert.match(ffmi?.classificacao ?? '', /descritivo/i);

assert.deepEqual(zonasTreinamento(176), {
  z1: { min: 88, max: 106 },
  z2: { min: 106, max: 123 },
  z3: { min: 123, max: 141 },
  z4: { min: 141, max: 158 },
  z5: { min: 158, max: 176 },
});
assert.equal(classificaVO2(42, 'M', 46), 'Bom');
assert.equal(scoreVO2(42, 'M', 46), 78);
assert.equal(normalizeFriendModality('Esteira'), 'treadmill');
assert.equal(normalizeFriendModality('Bike'), 'cycle');
assert.equal(normalizeFriendModality('Remo'), null);
const friend = calculateFriendComparison({ measuredVo2: 44, age: 40, sex: 'M', weightKg: 80, heightCm: 180, modality: 'treadmill' });
assert.ok(friend);
assert.equal(friend?.predictedVo2, 41.6);
assert.equal(friend?.percentPredicted, 105.8);
assert.equal(friend?.interpretation, 'within_estimate');
assert.equal(calculateFriendComparison({ measuredVo2: 40, age: 19, sex: 'M', weightKg: 80, heightCm: 180, modality: 'treadmill' }), null);
assert.equal(friendComparisonFromAssessment({
  cardio: { protocolo: 'Bike', vo2max: 32 },
  anthropometry: { peso: 70, estatura: 170 },
  bioimpedance: null,
  age: 50,
  sex: 'F',
})?.modality, 'cycle');
assert.deepEqual(classificarWells(22, 'M', 46), {
  classificacao: 'Regular',
  percentil: 'Faixa ACSM',
});
assert.equal(scoreFlexibilidade(22, 'M', 46), 54);

assert.equal(forcaRelativa(38, 76), 0.5);
assert.equal(assimetria(38, 35), 7.89);

assert.equal(scoreComposicaoCorporal({ pctGordura:null, imc:null, sexo:'M' }), null);
assert.equal(scoreComposicaoCorporal({ pctGordura:null, imc:23, sexo:'M' }), 100);
assert.equal(scoreComposicaoCorporal({ pctGordura:20, imc:null, sexo:'M' }), 88);
assert.equal(scoreComposicaoCorporal({ pctGordura:20, imc:23, sexo:'M' }), 92);

const rml = calcularRML({
  categoria: 'jovem_ativo',
  sexo: 'M',
  idade: 46,
  mmss_reps: 20,
  abd_1min_reps: 32,
  abd_prancha_seg: 45,
  mmii_agach_reps: 25,
  mmii_wallsit_seg: 45,
});
assert.equal(rml.score, 90);
assert.equal(rml.mmss_classificacao, 'Bom');
assert.equal(rml.abd_1min_classificacao, 'Excelente');
assert.equal(rml.abd_prancha_classificacao, undefined);
assert.equal(rml.mmii_agach_classificacao, undefined);
assert.equal(rml.mmii_wallsit_classificacao, undefined);

assert.equal(classificarComposicaoCorporal({ pctGordura:12, imc:28, sexo:'M' }).label, 'Atletico');

const antroV2 = {
  registro_v2: { version: 2 },
  resultados_v2: { results: [{ id: 'fatPercent', selected: true, status: 'available', value: 18.4, label: 'Durnin-Womersley + Siri' }] },
};
assert.equal(percentualGorduraAntropometria(antroV2), 18.4);
assert.deepEqual(composicaoOficialParaIA(antroV2, { percentual_gordura: 27.9 }), {
  percentual_gordura: 18.4,
  fonte: 'antropometria',
  metodo: 'Durnin-Womersley + Siri',
  percentual_bioimpedancia_excluido: true,
  regra: 'O percentual de gordura global da IA vem exclusivamente da antropometria. Nao substituir pela bioimpedancia.',
});
assert.equal(composicaoOficialParaIA(null, { percentual_gordura: 27.9 }).percentual_gordura, null);
const antroV2SingleReading = {
  registro_v2: { version: 2 },
  resultados_v2: { results: [{ id: 'fatPercent', selected: true, status: 'review', value: 18.2, label: 'Durnin-Womersley + Siri' }] },
};
assert.equal(percentualGorduraAntropometria(antroV2SingleReading), 18.2,
  'percentual calculado em coleta unica deve ser utilizado com ressalva');

console.log('OK: formulas clinicas principais validadas');
