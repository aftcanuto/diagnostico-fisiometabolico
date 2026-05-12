import assert from 'node:assert/strict';
import { montarCsv, valorCsv } from '../src/lib/backup/avaliacoesCsv';

assert.equal(valorCsv('texto simples'), '"texto simples"');
assert.equal(valorCsv('texto "com aspas"'), '"texto ""com aspas"""');
assert.equal(valorCsv('=IMPORTXML("http://exemplo")'), '"\'=IMPORTXML(""http://exemplo"")"');
assert.equal(valorCsv('+SUM(1,1)'), '"\'+SUM(1,1)"');
assert.equal(valorCsv('-10+20'), '"\'-10+20"');
assert.equal(valorCsv('@comando'), '"\'@comando"');
assert.equal(valorCsv({ score: 78, modulo: 'rml' }), '"{""score"":78,""modulo"":""rml""}"');

const csv = montarCsv(
  ['paciente_nome', 'score_global', 'analises_ia'],
  [
    {
      paciente_nome: 'Andre Felipe',
      score_global: 78,
      analises_ia: [{ tipo: 'rml', texto: 'Boa resistencia' }],
    },
  ],
);

assert.ok(csv.startsWith('\uFEFF'), 'CSV precisa sair com BOM UTF-8 para Excel');
assert.ok(csv.includes('"paciente_nome";"score_global";"analises_ia"'));
assert.ok(csv.includes('"Andre Felipe";"78";'));
assert.ok(csv.includes('Boa resistencia'));

console.log('OK: backup em planilha validado');

