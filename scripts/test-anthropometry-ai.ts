import assert from 'node:assert/strict';
import { MEASUREMENTS, calculateAnthropometry, newAnthropometry } from '../src/lib/anthropometry';
import { anthropometryAIData, anthropometryAnalysisUsable } from '../src/lib/anthropometry-record';
import { promptAntropometria, ANTHROPOMETRY_AI_RULES } from '../src/lib/ai/prompts';

const input = newAnthropometry();
for (const measurement of MEASUREMENTS) {
  const value = measurement.id === 'mass' ? 75 : measurement.id === 'height' ? 175 : measurement.group === 'skinfold' ? 12 : measurement.group === 'breadth' ? 7 : 35;
  input.measurements[measurement.id].readings = [value, value, null];
}
input.methods = ['indices', 'martin1990', 'martinBone1991', 'phantom'];
const results = calculateAnthropometry(input, { date:'2026-09-28', birthDate:'1990-01-01', sex:'M' });
const row = { registro_v2:input, resultados_v2:results, revision_v2:3 };
const safe = anthropometryAIData(row) as any;
assert.equal(safe.resultados.results.every((item:any) => item.selected), true);
assert.equal(safe.resultados.results.find((item:any) => item.id === 'martin1990').value, null, 'resultado em revisao nao deve chegar como fato confirmado');
assert.equal(safe.resultados.results.find((item:any) => item.id === 'bmi')?.status, 'available');
const prompt = promptAntropometria({ nome:'Paciente teste', sexo:'M', idade:36 }, row);
assert.match(prompt.system, /nao diagnostica risco/i);
assert.doesNotMatch(prompt.user, /potencial genetico|limite natural/i);
assert.match(prompt.user, /MARTIN_1990/);
assert.match(ANTHROPOMETRY_AI_RULES, /nao combine equacoes/i);
assert.equal(anthropometryAnalysisUsable({ tipo:'antropometria', conteudo:{ _anthropometry_revision:3 } }, row), true);
assert.equal(anthropometryAnalysisUsable({ tipo:'conclusao_global', conteudo:{ _anthropometry_revision:2 } }, row), false);
assert.equal(anthropometryAnalysisUsable({ tipo:'jump_test', conteudo:{} }, row), true);
console.log('Antropometria IA: snapshot selecionado, revisao anulada, prompt seguro, referencias e invalidacao por revisao aprovados.');
