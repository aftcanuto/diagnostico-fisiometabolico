import assert from 'node:assert/strict';

import { calcFFMI, imc, massaMagra, mediaDobra, percentualGorduraJP7, rcq } from '../src/lib/calculations/antropometria';
import { classificaVO2, fcMaxTanaka, scoreVO2, zonasTreinamento } from '../src/lib/calculations/cardio';
import { classificarWells, scoreFlexibilidade } from '../src/lib/calculations/flexibilidade';
import { assimetria, forcaRelativa } from '../src/lib/calculations/forca';
import { calcularRML } from '../src/lib/calculations/rml';
import { scoreComposicaoCorporal } from '../src/lib/scores';

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

assert.equal(fcMaxTanaka(46), 176);
assert.deepEqual(zonasTreinamento(176), {
  z1: { min: 88, max: 106 },
  z2: { min: 106, max: 123 },
  z3: { min: 123, max: 141 },
  z4: { min: 141, max: 158 },
  z5: { min: 158, max: 176 },
});
assert.equal(classificaVO2(42, 'M', 46), 'Bom');
assert.equal(scoreVO2(42, 'M', 46), 78);

assert.deepEqual(classificarWells(22, 'M', 46), {
  classificacao: 'Regular',
  percentil: 'P30-P49',
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
assert.equal(rml.score, 68);
assert.equal(rml.mmss_classificacao, 'Bom');
assert.equal(rml.abd_1min_classificacao, 'Excelente');
assert.equal(rml.abd_prancha_classificacao, 'Regular');
assert.equal(rml.mmii_agach_classificacao, 'Regular');
assert.equal(rml.mmii_wallsit_classificacao, 'Fraco');

console.log('OK: formulas clinicas principais validadas');
