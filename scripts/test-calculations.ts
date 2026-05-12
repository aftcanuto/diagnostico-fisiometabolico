import assert from 'node:assert/strict';

import { calcFFMI, imc, massaMagra, mediaDobra, rcq } from '../src/lib/calculations/antropometria';
import { classificaVO2, fcMaxTanaka, scoreVO2, zonasTreinamento } from '../src/lib/calculations/cardio';
import { classificarWells, scoreFlexibilidade } from '../src/lib/calculations/flexibilidade';
import { assimetria, forcaRelativa } from '../src/lib/calculations/forca';
import { calcLimiteNatural } from '../src/lib/calculations/limiteNatural';
import { calcularRML } from '../src/lib/calculations/rml';

function quaseIgual(valor: number, esperado: number, margem = 0.01) {
  assert.ok(Math.abs(valor - esperado) <= margem, `Esperado ${esperado}, recebido ${valor}`);
}

assert.equal(imc(76, 170), 26.3);
assert.deepEqual(mediaDobra(10, 10.4, null), { media: 10.2, precisaTerceira: false });
assert.deepEqual(mediaDobra(10, 12, null), { media: null, precisaTerceira: true });
assert.equal(massaMagra(76, 14.32), 65.12);
assert.equal(rcq(72, 92), 0.783);

const ffmi = calcFFMI(76, 170, 14.32);
assert.ok(ffmi);
assert.equal(ffmi?.ffmi, 22.5);
assert.equal(ffmi?.classificacao, 'Alto');

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
assert.equal(scoreFlexibilidade(22, 'M', 46), 52);

assert.equal(forcaRelativa(38, 76), 0.5);
assert.equal(assimetria(38, 35), 7.89);

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

const limite = calcLimiteNatural({
  massaMagra: 65.12,
  estaturaCm: 170,
  sexo: 'M',
  massaOssea: 9.77,
});
assert.equal(limite.ffmi, 22.5);
quaseIgual(limite.pctDoLimite, 93);
assert.equal(limite.osseaStatus, 'Adequada');

console.log('OK: formulas clinicas principais validadas');
